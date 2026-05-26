import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ConversationList from "@/features/chat/components/conversation-list/ConversationList";
import { chatApi } from "@/features/chat/apis/chat.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type {
  ChatMessage,
  Conversation,
  ConversationDetail,
} from "@/features/chat/types/chat.type";

export interface ChatOutletContext {
  conversation: ConversationDetail | null;
  messages: ChatMessage[];
  currentUserId: number;
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  sending: boolean;
  onLoadOlderMessages: () => void;
  onSendMessage: (content: string) => void;
  onMuteChanged: (isMuted: boolean) => void;
}

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
};

const ChatLayout = () => {
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

  const activeConversationIdRef = useRef<number | undefined>(conversationId);
  activeConversationIdRef.current = conversationId;

  const refreshConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await chatApi.listConversations("ALL", 1, 30);
      setConversations(res.data.items);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!conversationId) {
      setActiveConversation(null);
      setMessages([]);
      setNextCursor(null);
      setHasMoreMessages(false);
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

        await chatApi.markRead(conversationId);

        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      } catch (error: unknown) {
        if (cancelled) return;

        const message = getErrorMessage(error);

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
  }, [conversationId, navigate]);

  const handleSelectConversation = (id: number) => {
    navigate(`/messages/${id}`);
  };

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
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId, hasMoreMessages, nextCursor, loadingMessages]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      try {
        setSending(true);
        const res = await chatApi.sendMessage(conversationId, { content });
        const newMessage = res.data;

        if (activeConversationIdRef.current === conversationId) {
          setMessages((prev) => [...prev, newMessage]);
        }

        setConversations((prev) => {
          const idx = prev.findIndex((item) => item.id === conversationId);
          if (idx === -1) {
            return prev;
          }
          const updated = {
            ...prev[idx],
            lastMessage: newMessage,
            lastMessageAt: newMessage.createdAt,
            unreadCount: 0,
          };
          const rest = prev.filter((item) => item.id !== conversationId);
          return [updated, ...rest];
        });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  const handleMuteChanged = useCallback(
    (isMuted: boolean) => {
      setActiveConversation((prev) =>
        prev ? { ...prev, isMuted } : prev,
      );
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

  const context: ChatOutletContext = {
    conversation: activeConversation,
    messages,
    currentUserId,
    loadingMessages,
    hasMoreMessages,
    sending,
    onLoadOlderMessages: handleLoadOlderMessages,
    onSendMessage: handleSendMessage,
    onMuteChanged: handleMuteChanged,
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      <ConversationList
        conversations={conversations}
        activeConversationId={conversationId}
        currentUserId={currentUserId}
        loading={loadingConversations}
        onSelectConversation={handleSelectConversation}
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
  );
};

export default ChatLayout;
