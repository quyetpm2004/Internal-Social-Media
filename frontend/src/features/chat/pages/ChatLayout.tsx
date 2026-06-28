import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ConversationList from "@/features/chat/components/conversation-list/ConversationList";
import { chatApi } from "@/features/chat/apis/chat.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useChatSocket } from "@/features/chat/hooks/useChatSocket";
import type {
  ChatMessage,
  Conversation,
  ConversationDetail,
} from "@/features/chat/types/chat.type";
import type {
  MembersUpdatedPayload,
  MessageDeletedPayload,
  MessageEditedPayload,
  MessageNewPayload,
  PresencePayload,
  PresenceSnapshotPayload,
  PollVotePayload,
  ReadUpdatePayload,
  TypingPayload,
} from "@/features/chat/types/chat-events.type";
import type { SendMessagePayload } from "@/features/chat/components/chat-window/MessageInput";
import type { PollSummary } from "@/types/poll.type";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export interface ChatOutletContext {
  conversation: ConversationDetail | null;
  messages: ChatMessage[];
  currentUserId: number;
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  sending: boolean;
  onlineUserIds: number[];
  typingUserIds: number[];
  /** Map userId -> ISO lastReadAt; cập nhật realtime khi nhận read:update */
  readReceipts: Map<number, string>;
  /**
   * Snapshot lastReadAt của chính user khi mở conversation, dùng để
   * vẽ separator "X tin nhắn chưa đọc" giữa luồng message.
   */
  unreadAnchor: string | null;
  onLoadOlderMessages: () => void;
  onSendMessage: (payload: SendMessagePayload) => Promise<void>;
  onEditMessage: (messageId: number, content: string) => Promise<void>;
  onDeleteMessage: (messageId: number) => Promise<void>;
  onPollVote: (messageId: number, poll: PollSummary) => void;
  onMuteChanged: (isMuted: boolean) => void;
  onConversationUpdated: (conversation: ConversationDetail) => void;
  onGroupCreated: (conversationId: number) => void;
  onLeftGroup: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || fallback;
};

const TYPING_TIMEOUT_MS = 4000;

const ChatLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId: conversationIdParam } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id ?? 0;

  const conversationId = conversationIdParam
    ? Number(conversationIdParam)
    : undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const [activeConversation, setActiveConversation] =
    useState<ConversationDetail | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const [sending, setSending] = useState(false);

  // Realtime state
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  // Map conversationId -> Set<userId> đang gõ
  const [typingMap, setTypingMap] = useState<Map<number, Set<number>>>(
    new Map(),
  );
  // Map userId -> ISO lastReadAt cho active conversation
  const [readReceipts, setReadReceipts] = useState<Map<number, string>>(
    new Map(),
  );
  // Snapshot lastReadAt của user hiện tại khi mở conversation
  const [unreadAnchor, setUnreadAnchor] = useState<string | null>(null);

  const activeConversationIdRef = useRef<number | undefined>(conversationId);
  activeConversationIdRef.current = conversationId;

  // ----- Helpers -----

  const refreshConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await chatApi.listConversations("ALL", 1, 30);
      setConversations(res.data.items);
    } catch (error) {
      toast.error(getErrorMessage(error, t("common.genericError")));
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const upsertConversationOnNewMessage = useCallback(
    (incoming: ChatMessage, isViewing: boolean) => {
      setConversations((prev) => {
        const idx = prev.findIndex(
          (item) => item.id === incoming.conversationId,
        );
        if (idx === -1) {
          // Conversation chưa có trong list → refresh để lấy đầy đủ thông tin
          refreshConversations();
          return prev;
        }

        const current = prev[idx];
        const isOwn = incoming.senderId === currentUserId;
        const isSystem = incoming.contentType === "SYSTEM";
        const shouldIncrementUnread = !isOwn && !isViewing && !isSystem;

        const updated: Conversation = {
          ...current,
          lastMessage: incoming,
          lastMessageAt: incoming.createdAt,
          unreadCount: shouldIncrementUnread
            ? current.unreadCount + 1
            : isViewing
              ? 0
              : current.unreadCount,
        };

        const rest = prev.filter((item) => item.id !== incoming.conversationId);
        return [updated, ...rest];
      });
    },
    [currentUserId, refreshConversations],
  );

  // ----- Realtime event handlers -----

  const handleMessageNew = useCallback(
    ({ message }: MessageNewPayload) => {
      const isViewing =
        activeConversationIdRef.current === message.conversationId;

      if (isViewing) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Tự đánh dấu đã đọc nếu đang mở conversation và không phải tin của mình
        if (message.senderId !== currentUserId) {
          chatApi.markRead(message.conversationId).catch(() => {});
        }
      }

      upsertConversationOnNewMessage(message, isViewing);

      // Khi nhận message mới, người gửi đã ngừng typing
      setTypingMap((prev) => {
        const next = new Map(prev);
        const set = next.get(message.conversationId);
        if (!set) return prev;
        if (!set.has(message.senderId)) return prev;
        const newSet = new Set(set);
        newSet.delete(message.senderId);
        if (newSet.size === 0) {
          next.delete(message.conversationId);
        } else {
          next.set(message.conversationId, newSet);
        }
        return next;
      });
    },
    [currentUserId, upsertConversationOnNewMessage],
  );

  const handleMessageEdited = useCallback(
    ({ message }: MessageEditedPayload) => {
      if (activeConversationIdRef.current === message.conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m)),
        );
      }

      setConversations((prev) =>
        prev.map((item) =>
          item.lastMessage?.id === message.id
            ? { ...item, lastMessage: message }
            : item,
        ),
      );
    },
    [],
  );

  const handleMessageDeleted = useCallback(
    ({ conversationId: convId, messageId }: MessageDeletedPayload) => {
      if (activeConversationIdRef.current === convId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "DELETED", content: "" } : m,
          ),
        );
      }

      setConversations((prev) =>
        prev.map((item) =>
          item.lastMessage?.id === messageId
            ? {
                ...item,
                lastMessage: item.lastMessage
                  ? { ...item.lastMessage, status: "DELETED", content: "" }
                  : item.lastMessage,
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleReadUpdate = useCallback(
    ({ conversationId: convId, userId, lastReadAt }: ReadUpdatePayload) => {
      // Cập nhật read receipts cho active conversation
      if (activeConversationIdRef.current === convId) {
        setReadReceipts((prev) => {
          const existing = prev.get(userId);
          if (existing && existing >= lastReadAt) return prev;
          const next = new Map(prev);
          next.set(userId, lastReadAt);
          return next;
        });
      }

      // Chỉ reset unreadCount khi chính mình mark read (vd: tab khác)
      if (userId === currentUserId) {
        setConversations((prev) =>
          prev.map((item) =>
            item.id === convId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      }
    },
    [currentUserId],
  );

  const handleTypingStart = useCallback(
    ({ conversationId: convId, userId }: TypingPayload) => {
      if (userId === currentUserId) return;

      setTypingMap((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(convId) ?? []);
        set.add(userId);
        next.set(convId, set);
        return next;
      });
    },
    [currentUserId],
  );

  const handleTypingStop = useCallback(
    ({ conversationId: convId, userId }: TypingPayload) => {
      if (userId === currentUserId) return;

      setTypingMap((prev) => {
        const set = prev.get(convId);
        if (!set || !set.has(userId)) return prev;
        const next = new Map(prev);
        const newSet = new Set(set);
        newSet.delete(userId);
        if (newSet.size === 0) {
          next.delete(convId);
        } else {
          next.set(convId, newSet);
        }
        return next;
      });
    },
    [currentUserId],
  );

  const handlePresenceOnline = useCallback(({ userId }: PresencePayload) => {
    setOnlineUserIds((prev) => {
      if (prev.has(userId)) return prev;
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  }, []);

  const handlePresenceOffline = useCallback(({ userId }: PresencePayload) => {
    setOnlineUserIds((prev) => {
      if (!prev.has(userId)) return prev;
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const handlePresenceSnapshot = useCallback(
    ({ onlineUserIds: ids }: PresenceSnapshotPayload) => {
      setOnlineUserIds(new Set(ids));
    },
    [],
  );

  const handleMembersUpdated = useCallback(
    async ({
      conversationId: convId,
      action,
      affectedUserIds,
    }: MembersUpdatedPayload) => {
      const isViewing = activeConversationIdRef.current === convId;
      const isAffected = affectedUserIds.includes(currentUserId);

      if (isAffected && (action === "removed" || action === "left")) {
        if (activeConversationIdRef.current === convId) {
          const message =
            action === "left"
              ? t("pages.chat.leftGroup")
              : t("pages.chat.removedFromGroup");
          toast.info(message);
          setActiveConversation(null);
          setMessages([]);
          navigate("/messages");
        }
        await refreshConversations();
        return;
      }

      if (isViewing) {
        try {
          const res = await chatApi.getConversationDetail(convId);
          setActiveConversation(res.data);
        } catch (error) {
          toast.error(getErrorMessage(error, t("common.genericError")));
        }
      }

      await refreshConversations();
    },
    [currentUserId, navigate, refreshConversations],
  );

  const handlePollVoteUpdate = useCallback(
    (messageId: number, poll: PollSummary) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, poll } : m)),
      );
    },
    [],
  );

  const handlePollVoteSocket = useCallback(
    ({ conversationId: convId, poll }: PollVotePayload) => {
      if (activeConversationIdRef.current !== convId) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.poll?.id !== poll.id) return m;
          return {
            ...m,
            poll: {
              ...poll,
              myVotes: m.poll?.myVotes ?? poll.myVotes,
            },
          };
        }),
      );
    },
    [],
  );

  const { emitTypingStart, emitTypingStop } = useChatSocket({
    onMessageNew: handleMessageNew,
    onMessageEdited: handleMessageEdited,
    onMessageDeleted: handleMessageDeleted,
    onReadUpdate: handleReadUpdate,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
    onPresenceOnline: handlePresenceOnline,
    onPresenceOffline: handlePresenceOffline,
    onPresenceSnapshot: handlePresenceSnapshot,
    onMembersUpdated: handleMembersUpdated,
    onPollVote: handlePollVoteSocket,
  });

  // ----- Effects -----

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!conversationId) {
      setActiveConversation(null);
      setMessages([]);
      setNextCursor(null);
      setHasMoreMessages(false);
      setReadReceipts(new Map());
      setUnreadAnchor(null);
      return;
    }

    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      navigate("/messages", { replace: true });
      return;
    }

    let cancelled = false;

    const fetchConversation = async () => {
      try {
        setLoadingMessages(true);

        const [detailRes, messagesRes] = await Promise.all([
          chatApi.getConversationDetail(conversationId),
          chatApi.listMessages(conversationId, { limit: 30 }),
        ]);

        if (cancelled || activeConversationIdRef.current !== conversationId) {
          return;
        }

        setActiveConversation(detailRes.data);
        setMessages(messagesRes.data.items);
        setHasMoreMessages(messagesRes.data.pagination.hasMore);
        setNextCursor(messagesRes.data.pagination.nextCursor);

        // Khởi tạo read receipts từ members (giá trị TRƯỚC khi mark read)
        const initialReceipts = new Map<number, string>();
        for (const member of detailRes.data.members) {
          if (member.lastReadAt) {
            initialReceipts.set(member.user.id, member.lastReadAt);
          }
        }
        setReadReceipts(initialReceipts);

        // Snapshot lastReadAt của user hiện tại để vẽ divider unread
        const me = detailRes.data.members.find(
          (m) => m.user.id === currentUserId,
        );
        setUnreadAnchor(me?.lastReadAt ?? null);

        await chatApi.markRead(conversationId);

        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      } catch (error: unknown) {
        if (cancelled) return;

        const message = getErrorMessage(error, t("common.genericError"));

        const status = (error as { response?: { status?: number } })?.response
          ?.status;

        if (status === 403 || status === 404) {
          toast.error(message);
          navigate("/messages", { replace: true });
        } else {
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    };

    fetchConversation();

    return () => {
      cancelled = true;
    };
  }, [conversationId, navigate, currentUserId]);

  // ----- UI handlers -----

  const handleSelectConversation = (id: number) => {
    navigate(`/messages/${id}`);
  };

  const handleOpenUserChat = useCallback(
    async (otherUserId: number) => {
      try {
        const res = await chatApi.createDirectConversation(otherUserId);
        const conversation = res.data;
        await refreshConversations();
        navigate(`/messages/${conversation.id}`);
      } catch (error) {
        toast.error(getErrorMessage(error, t("common.genericError")));
        throw error;
      }
    },
    [navigate, refreshConversations],
  );

  const handleConversationUpdated = useCallback(
    (updated: ConversationDetail) => {
      setActiveConversation(updated);
      setConversations((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                name: updated.name,
                avatarUrl: updated.avatarUrl,
                memberCount: updated.memberCount,
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleGroupCreated = useCallback(
    async (newConversationId: number) => {
      await refreshConversations();
      navigate(`/messages/${newConversationId}`);
    },
    [navigate, refreshConversations],
  );

  const handleLeftGroup = useCallback(async () => {
    setActiveConversation(null);
    setMessages([]);
    await refreshConversations();
    navigate("/messages");
  }, [navigate, refreshConversations]);

  const handleLoadOlderMessages = useCallback(async () => {
    if (!conversationId || !hasMoreMessages || !nextCursor || loadingMessages) {
      return;
    }

    try {
      setLoadingMessages(true);

      const res = await chatApi.listMessages(conversationId, {
        cursor: nextCursor,
        limit: 30,
      });

      if (activeConversationIdRef.current !== conversationId) return;

      setMessages((prev) => [...res.data.items, ...prev]);
      setHasMoreMessages(res.data.pagination.hasMore);
      setNextCursor(res.data.pagination.nextCursor);
    } catch (error) {
      toast.error(getErrorMessage(error, t("common.genericError")));
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId, hasMoreMessages, nextCursor, loadingMessages]);

  const handleSendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!conversationId) return;

      try {
        setSending(true);
        const res = await chatApi.sendMessage(conversationId, {
          content: payload.content,
          contentType: payload.contentType,
          attachmentIds: payload.attachmentIds,
          mentionedUserIds: payload.mentionedUserIds,
          mentionAll: payload.mentionAll,
          poll: payload.poll,
        });
        const newMessage = res.data;

        // Append ngay từ REST response để UX nhanh, đồng thời handler
        // message:new sẽ dedupe theo id nếu socket cũng nhận được
        if (activeConversationIdRef.current === conversationId) {
          setMessages((prev) =>
            prev.some((m) => m.id === newMessage.id)
              ? prev
              : [...prev, newMessage],
          );
        }

        upsertConversationOnNewMessage(newMessage, true);
      } catch (error) {
        const message = getErrorMessage(error, t("common.genericError"));
        toast.error(message);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [conversationId, upsertConversationOnNewMessage],
  );

  const handleEditMessage = useCallback(
    async (messageId: number, content: string) => {
      try {
        const res = await chatApi.editMessage(messageId, content);
        const updated = res.data;

        if (activeConversationIdRef.current === updated.conversationId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          );
        }

        setConversations((prev) =>
          prev.map((item) =>
            item.lastMessage?.id === updated.id
              ? { ...item, lastMessage: updated }
              : item,
          ),
        );
      } catch (error) {
        toast.error(getErrorMessage(error, t("common.genericError")));
        throw error;
      }
    },
    [],
  );

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    try {
      await chatApi.deleteMessage(messageId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "DELETED", content: "" } : m,
        ),
      );

      setConversations((prev) =>
        prev.map((item) =>
          item.lastMessage?.id === messageId
            ? {
                ...item,
                lastMessage: item.lastMessage
                  ? { ...item.lastMessage, status: "DELETED", content: "" }
                  : item.lastMessage,
              }
            : item,
        ),
      );
    } catch (error) {
      toast.error(getErrorMessage(error, t("common.genericError")));
      throw error;
    }
  }, []);

  const handleMuteChanged = useCallback(
    (isMuted: boolean) => {
      setActiveConversation((prev) => (prev ? { ...prev, isMuted } : prev));
      if (conversationId) {
        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId ? { ...item, isMuted } : item,
          ),
        );
      }
    },
    [conversationId],
  );

  // ----- Typing emit có debounce/throttle nhẹ -----
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleTypingStartUser = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingRef.current) {
      // Chỉ emit 1 lần
      isTypingRef.current = true;
      emitTypingStart(conversationId);
    }

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = setTimeout(() => {
      if (!conversationId) return;
      isTypingRef.current = false;
      emitTypingStop(conversationId);
    }, TYPING_TIMEOUT_MS);
  }, [conversationId, emitTypingStart, emitTypingStop]);

  const handleTypingStopUser = useCallback(() => {
    if (!conversationId) return;
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitTypingStop(conversationId);
    }
  }, [conversationId, emitTypingStop]);

  useEffect(() => {
    // Khi đổi conversation, reset trạng thái typing
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    isTypingRef.current = false;
  }, [conversationId]);

  // ----- Derived -----

  const typingUserIds = useMemo<number[]>(() => {
    if (!conversationId) return [];
    const set = typingMap.get(conversationId);
    return set ? Array.from(set) : [];
  }, [typingMap, conversationId]);

  const onlineUserIdsList = useMemo(
    () => Array.from(onlineUserIds),
    [onlineUserIds],
  );

  const context: ChatOutletContext = {
    conversation: activeConversation,
    messages,
    currentUserId,
    loadingMessages,
    hasMoreMessages,
    sending,
    onlineUserIds: onlineUserIdsList,
    typingUserIds,
    readReceipts,
    unreadAnchor,
    onLoadOlderMessages: handleLoadOlderMessages,
    onSendMessage: handleSendMessage,
    onEditMessage: handleEditMessage,
    onDeleteMessage: handleDeleteMessage,
    onPollVote: handlePollVoteUpdate,
    onMuteChanged: handleMuteChanged,
    onConversationUpdated: handleConversationUpdated,
    onGroupCreated: handleGroupCreated,
    onLeftGroup: handleLeftGroup,
    onTypingStart: handleTypingStartUser,
    onTypingStop: handleTypingStopUser,
  };

  return (
    <>
      <div className="md:hidden">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 py-4 dark:hover:text-slate-300 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">{t("common.back")}</span>
        </button>
      </div>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
        <ConversationList
          conversations={conversations}
          activeConversationId={conversationId}
          currentUserId={currentUserId}
          loading={loadingConversations}
          onlineUserIds={onlineUserIdsList}
          onSelectConversation={handleSelectConversation}
          onOpenUserChat={handleOpenUserChat}
          className={conversationId ? "hidden md:flex" : "flex"}
        />

        <div
          className={`flex-1 flex min-w-0 ${
            conversationId ? "flex" : "hidden md:flex"
          }`}
        >
          <Outlet context={context} />
        </div>
      </div>
    </>
  );
};

export default ChatLayout;
