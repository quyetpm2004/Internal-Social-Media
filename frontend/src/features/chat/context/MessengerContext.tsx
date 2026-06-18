import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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

const MAX_OPEN_WINDOWS = 3;
const TYPING_TIMEOUT_MS = 4000;

export interface OpenMessengerWindow {
  conversationId: number;
  minimized: boolean;
}

export interface WindowChatState {
  conversation: ConversationDetail | null;
  messages: ChatMessage[];
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  nextCursor: number | null;
  sending: boolean;
  readReceipts: Map<number, string>;
  unreadAnchor: string | null;
}

const createEmptyWindowState = (): WindowChatState => ({
  conversation: null,
  messages: [],
  loadingMessages: false,
  hasMoreMessages: false,
  nextCursor: null,
  sending: false,
  readReceipts: new Map(),
  unreadAnchor: null,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || fallback;
};

interface MessengerContextValue {
  conversations: Conversation[];
  loadingConversations: boolean;
  onlineUserIds: number[];
  openWindows: OpenMessengerWindow[];
  windowStates: Record<number, WindowChatState>;
  totalUnreadCount: number;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  refreshConversations: () => Promise<void>;
  openConversation: (conversationId: number) => void;
  closeConversation: (conversationId: number) => void;
  toggleMinimize: (conversationId: number) => void;
  getTypingUserIds: (conversationId: number) => number[];
  loadOlderMessages: (conversationId: number) => Promise<void>;
  sendMessage: (
    conversationId: number,
    payload: SendMessagePayload,
  ) => Promise<void>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  onPollVote: (messageId: number, poll: PollSummary) => void;
  onTypingStart: (conversationId: number) => void;
  onTypingStop: (conversationId: number) => void;
  showDock: boolean;
}

const MessengerContext = createContext<MessengerContextValue | null>(null);

export const useMessenger = () => {
  const ctx = useContext(MessengerContext);
  if (!ctx) {
    throw new Error("useMessenger must be used within MessengerProvider");
  }
  return ctx;
};

export const MessengerProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id ?? 0;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [openWindows, setOpenWindows] = useState<OpenMessengerWindow[]>([]);
  const [windowStates, setWindowStates] = useState<
    Record<number, WindowChatState>
  >({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const [typingMap, setTypingMap] = useState<Map<number, Set<number>>>(
    new Map(),
  );

  const windowStatesRef = useRef(windowStates);
  windowStatesRef.current = windowStates;

  const typingTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const isTypingRef = useRef<Map<number, boolean>>(new Map());

  const showDock = !location.pathname.startsWith("/messages");

  const viewingConversationIds = useMemo(() => {
    return new Set(
      openWindows
        .filter((w) => !w.minimized)
        .map((w) => w.conversationId),
    );
  }, [openWindows]);

  const totalUnreadCount = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

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
  }, [t]);

  const upsertConversationOnNewMessage = useCallback(
    (incoming: ChatMessage, isViewing: boolean) => {
      setConversations((prev) => {
        const idx = prev.findIndex(
          (item) => item.id === incoming.conversationId,
        );
        if (idx === -1) {
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

  const updateWindowState = useCallback(
    (
      conversationId: number,
      updater: (prev: WindowChatState) => WindowChatState,
    ) => {
      setWindowStates((prev) => {
        const current = prev[conversationId] ?? createEmptyWindowState();
        return { ...prev, [conversationId]: updater(current) };
      });
    },
    [],
  );

  const loadConversationData = useCallback(
    async (conversationId: number) => {
      updateWindowState(conversationId, (s) => ({
        ...s,
        loadingMessages: true,
      }));

      try {
        const [detailRes, messagesRes] = await Promise.all([
          chatApi.getConversationDetail(conversationId),
          chatApi.listMessages(conversationId, { limit: 30 }),
        ]);

        const initialReceipts = new Map<number, string>();
        for (const member of detailRes.data.members) {
          if (member.lastReadAt) {
            initialReceipts.set(member.user.id, member.lastReadAt);
          }
        }

        const me = detailRes.data.members.find(
          (m) => m.user.id === currentUserId,
        );

        updateWindowState(conversationId, () => ({
          conversation: detailRes.data,
          messages: messagesRes.data.items,
          loadingMessages: false,
          hasMoreMessages: messagesRes.data.pagination.hasMore,
          nextCursor: messagesRes.data.pagination.nextCursor,
          sending: false,
          readReceipts: initialReceipts,
          unreadAnchor: me?.lastReadAt ?? null,
        }));

        await chatApi.markRead(conversationId);

        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      } catch (error) {
        updateWindowState(conversationId, (s) => ({
          ...s,
          loadingMessages: false,
        }));
        toast.error(getErrorMessage(error, t("common.genericError")));
      }
    },
    [currentUserId, t, updateWindowState],
  );

  const openConversation = useCallback(
    (conversationId: number) => {
      setDropdownOpen(false);

      setOpenWindows((prev) => {
        const existing = prev.find((w) => w.conversationId === conversationId);
        if (existing) {
          return prev.map((w) =>
            w.conversationId === conversationId
              ? { ...w, minimized: false }
              : w,
          );
        }

        const next = [
          ...prev.filter((w) => w.conversationId !== conversationId),
          { conversationId, minimized: false },
        ];

        if (next.length > MAX_OPEN_WINDOWS) {
          return next.slice(next.length - MAX_OPEN_WINDOWS);
        }

        return next;
      });

      if (!windowStatesRef.current[conversationId]?.conversation) {
        loadConversationData(conversationId);
      } else {
        chatApi.markRead(conversationId).catch(() => {});
        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      }
    },
    [loadConversationData],
  );

  const closeConversation = useCallback((conversationId: number) => {
    setOpenWindows((prev) =>
      prev.filter((w) => w.conversationId !== conversationId),
    );

    const timer = typingTimersRef.current.get(conversationId);
    if (timer) {
      clearTimeout(timer);
      typingTimersRef.current.delete(conversationId);
    }
    isTypingRef.current.delete(conversationId);
  }, []);

  const toggleMinimize = useCallback((conversationId: number) => {
    setOpenWindows((prev) =>
      prev.map((w) =>
        w.conversationId === conversationId
          ? { ...w, minimized: !w.minimized }
          : w,
      ),
    );
  }, []);

  const handleMessageNew = useCallback(
    ({ message }: MessageNewPayload) => {
      const isViewing = viewingConversationIds.has(message.conversationId);

      if (isViewing && windowStatesRef.current[message.conversationId]) {
        updateWindowState(message.conversationId, (s) => ({
          ...s,
          messages: s.messages.some((m) => m.id === message.id)
            ? s.messages
            : [...s.messages, message],
        }));

        if (message.senderId !== currentUserId) {
          chatApi.markRead(message.conversationId).catch(() => {});
        }
      }

      upsertConversationOnNewMessage(message, isViewing);

      setTypingMap((prev) => {
        const next = new Map(prev);
        const set = next.get(message.conversationId);
        if (!set || !set.has(message.senderId)) return prev;
        const newSet = new Set(set);
        newSet.delete(message.senderId);
        if (newSet.size === 0) next.delete(message.conversationId);
        else next.set(message.conversationId, newSet);
        return next;
      });
    },
    [currentUserId, upsertConversationOnNewMessage, updateWindowState, viewingConversationIds],
  );

  const handleMessageEdited = useCallback(
    ({ message }: MessageEditedPayload) => {
      if (windowStatesRef.current[message.conversationId]) {
        updateWindowState(message.conversationId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === message.id ? message : m,
          ),
        }));
      }

      setConversations((prev) =>
        prev.map((item) =>
          item.lastMessage?.id === message.id
            ? { ...item, lastMessage: message }
            : item,
        ),
      );
    },
    [updateWindowState],
  );

  const handleMessageDeleted = useCallback(
    ({ conversationId: convId, messageId }: MessageDeletedPayload) => {
      if (windowStatesRef.current[convId]) {
        updateWindowState(convId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === messageId
              ? { ...m, status: "DELETED", content: "" }
              : m,
          ),
        }));
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
    [updateWindowState],
  );

  const handleReadUpdate = useCallback(
    ({ conversationId: convId, userId, lastReadAt }: ReadUpdatePayload) => {
      if (windowStatesRef.current[convId]) {
        updateWindowState(convId, (s) => {
          const existing = s.readReceipts.get(userId);
          if (existing && existing >= lastReadAt) return s;
          const next = new Map(s.readReceipts);
          next.set(userId, lastReadAt);
          return { ...s, readReceipts: next };
        });
      }

      if (userId === currentUserId) {
        setConversations((prev) =>
          prev.map((item) =>
            item.id === convId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      }
    },
    [currentUserId, updateWindowState],
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
        if (newSet.size === 0) next.delete(convId);
        else next.set(convId, newSet);
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
      const isAffected = affectedUserIds.includes(currentUserId);

      if (isAffected && (action === "removed" || action === "left")) {
        closeConversation(convId);
        await refreshConversations();
        return;
      }

      if (windowStatesRef.current[convId]) {
        try {
          const res = await chatApi.getConversationDetail(convId);
          updateWindowState(convId, (s) => ({
            ...s,
            conversation: res.data,
          }));
        } catch {
          /* ignore */
        }
      }

      await refreshConversations();
    },
    [closeConversation, currentUserId, refreshConversations, updateWindowState],
  );

  const handlePollVoteSocket = useCallback(
    ({ conversationId: convId, poll }: PollVotePayload) => {
      if (!windowStatesRef.current[convId]) return;
      updateWindowState(convId, (s) => ({
        ...s,
        messages: s.messages.map((m) => {
          if (m.poll?.id !== poll.id) return m;
          return {
            ...m,
            poll: { ...poll, myVotes: m.poll?.myVotes ?? poll.myVotes },
          };
        }),
      }));
    },
    [updateWindowState],
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

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const getTypingUserIds = useCallback(
    (conversationId: number) => {
      const set = typingMap.get(conversationId);
      return set ? Array.from(set) : [];
    },
    [typingMap],
  );

  const loadOlderMessages = useCallback(
    async (conversationId: number) => {
      const state = windowStatesRef.current[conversationId];
      if (
        !state ||
        !state.hasMoreMessages ||
        !state.nextCursor ||
        state.loadingMessages
      ) {
        return;
      }

      updateWindowState(conversationId, (s) => ({
        ...s,
        loadingMessages: true,
      }));

      try {
        const res = await chatApi.listMessages(conversationId, {
          cursor: state.nextCursor,
          limit: 30,
        });

        updateWindowState(conversationId, (s) => ({
          ...s,
          messages: [...res.data.items, ...s.messages],
          hasMoreMessages: res.data.pagination.hasMore,
          nextCursor: res.data.pagination.nextCursor,
          loadingMessages: false,
        }));
      } catch (error) {
        updateWindowState(conversationId, (s) => ({
          ...s,
          loadingMessages: false,
        }));
        toast.error(getErrorMessage(error, t("common.genericError")));
      }
    },
    [t, updateWindowState],
  );

  const sendMessage = useCallback(
    async (conversationId: number, payload: SendMessagePayload) => {
      updateWindowState(conversationId, (s) => ({ ...s, sending: true }));

      try {
        const res = await chatApi.sendMessage(conversationId, {
          content: payload.content,
          contentType: payload.contentType,
          attachmentIds: payload.attachmentIds,
          poll: payload.poll,
        });
        const newMessage = res.data;

        updateWindowState(conversationId, (s) => ({
          ...s,
          messages: s.messages.some((m) => m.id === newMessage.id)
            ? s.messages
            : [...s.messages, newMessage],
          sending: false,
        }));

        upsertConversationOnNewMessage(newMessage, true);
      } catch (error) {
        updateWindowState(conversationId, (s) => ({ ...s, sending: false }));
        toast.error(getErrorMessage(error, t("common.genericError")));
        throw error;
      }
    },
    [t, updateWindowState, upsertConversationOnNewMessage],
  );

  const editMessage = useCallback(
    async (messageId: number, content: string) => {
      const res = await chatApi.editMessage(messageId, content);
      const updated = res.data;

      if (windowStatesRef.current[updated.conversationId]) {
        updateWindowState(updated.conversationId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === updated.id ? updated : m,
          ),
        }));
      }

      setConversations((prev) =>
        prev.map((item) =>
          item.lastMessage?.id === updated.id
            ? { ...item, lastMessage: updated }
            : item,
        ),
      );
    },
    [updateWindowState],
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      await chatApi.deleteMessage(messageId);

      setWindowStates((prev) => {
        const next = { ...prev };
        for (const [convId, state] of Object.entries(next)) {
          if (state.messages.some((m) => m.id === messageId)) {
            next[Number(convId)] = {
              ...state,
              messages: state.messages.map((m) =>
                m.id === messageId
                  ? { ...m, status: "DELETED", content: "" }
                  : m,
              ),
            };
          }
        }
        return next;
      });

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

  const onPollVote = useCallback(
    (messageId: number, poll: PollSummary) => {
      setWindowStates((prev) => {
        const next = { ...prev };
        for (const [convId, state] of Object.entries(next)) {
          if (state.messages.some((m) => m.id === messageId)) {
            next[Number(convId)] = {
              ...state,
              messages: state.messages.map((m) =>
                m.id === messageId ? { ...m, poll } : m,
              ),
            };
          }
        }
        return next;
      });
    },
    [],
  );

  const onTypingStart = useCallback(
    (conversationId: number) => {
      if (!isTypingRef.current.get(conversationId)) {
        isTypingRef.current.set(conversationId, true);
        emitTypingStart(conversationId);
      }

      const existing = typingTimersRef.current.get(conversationId);
      if (existing) clearTimeout(existing);

      typingTimersRef.current.set(
        conversationId,
        setTimeout(() => {
          isTypingRef.current.set(conversationId, false);
          emitTypingStop(conversationId);
          typingTimersRef.current.delete(conversationId);
        }, TYPING_TIMEOUT_MS),
      );
    },
    [emitTypingStart, emitTypingStop],
  );

  const onTypingStop = useCallback(
    (conversationId: number) => {
      const timer = typingTimersRef.current.get(conversationId);
      if (timer) {
        clearTimeout(timer);
        typingTimersRef.current.delete(conversationId);
      }
      if (isTypingRef.current.get(conversationId)) {
        isTypingRef.current.set(conversationId, false);
        emitTypingStop(conversationId);
      }
    },
    [emitTypingStop],
  );

  const value = useMemo<MessengerContextValue>(
    () => ({
      conversations,
      loadingConversations,
      onlineUserIds: Array.from(onlineUserIds),
      openWindows,
      windowStates,
      totalUnreadCount,
      dropdownOpen,
      setDropdownOpen,
      refreshConversations,
      openConversation,
      closeConversation,
      toggleMinimize,
      getTypingUserIds,
      loadOlderMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      onPollVote,
      onTypingStart,
      onTypingStop,
      showDock,
    }),
    [
      conversations,
      loadingConversations,
      onlineUserIds,
      openWindows,
      windowStates,
      totalUnreadCount,
      dropdownOpen,
      refreshConversations,
      openConversation,
      closeConversation,
      toggleMinimize,
      getTypingUserIds,
      loadOlderMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      onPollVote,
      onTypingStart,
      onTypingStop,
      showDock,
    ],
  );

  return (
    <MessengerContext.Provider value={value}>
      {children}
    </MessengerContext.Provider>
  );
};
