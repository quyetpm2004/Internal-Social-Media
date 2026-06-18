import { Fragment, useEffect, useMemo, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type {
  ChatMessage,
  ChatUser,
  ConversationDetail,
} from "@/features/chat/types/chat.type";
import type { PollSummary } from "@/types/poll.type";
import { groupMessagesByDate } from "@/features/chat/utils/format-message-time";
import { useTranslation } from "react-i18next";

interface MessageThreadProps {
  conversation: ConversationDetail;
  messages: ChatMessage[];
  currentUserId: number;
  loading?: boolean;
  hasMore?: boolean;
  typingUserIds?: number[];
  readReceipts?: Map<number, string>;
  unreadAnchor?: string | null;
  onLoadMore?: () => void;
  onEditMessage?: (messageId: number, content: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: number) => Promise<void> | void;
  onPollVote?: (messageId: number, poll: PollSummary) => void;
  compact?: boolean;
}

const MessageThread = ({
  conversation,
  messages,
  currentUserId,
  loading,
  hasMore,
  typingUserIds,
  readReceipts,
  unreadAnchor,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  onPollVote,
  compact = false,
}: MessageThreadProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (compact && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, conversation.id, typingUserIds?.length, compact]);

  const groups = groupMessagesByDate(messages);

  const isGroup = conversation.type === "GROUP";

  // ----- Read receipts: avatar người đã đọc đặt cạnh tin nhắn cuối họ đã xem -----
  const { readersByMessage, latestOwnMessageId } = useMemo(() => {
    const readers = new Map<number, ChatUser[]>();
    let latestOwn: number | null = null;

    for (const message of messages) {
      if (message.senderId === currentUserId) {
        latestOwn = message.id;
      }
    }

    if (!readReceipts || readReceipts.size === 0) {
      return { readersByMessage: readers, latestOwnMessageId: latestOwn };
    }

    // Với mỗi member khác chính mình, tìm own message mới nhất họ đã đọc
    for (const member of conversation.members) {
      if (member.user.id === currentUserId) continue;

      const lastReadAt = readReceipts.get(member.user.id);
      if (!lastReadAt) continue;

      let candidateId: number | null = null;
      for (const message of messages) {
        if (message.senderId !== currentUserId) continue;
        if (message.createdAt <= lastReadAt) {
          candidateId = message.id;
        } else {
          break;
        }
      }

      if (candidateId !== null) {
        const list = readers.get(candidateId) ?? [];
        list.push(member.user);
        readers.set(candidateId, list);
      }
    }

    return { readersByMessage: readers, latestOwnMessageId: latestOwn };
  }, [messages, conversation.members, readReceipts, currentUserId]);

  // ----- Unread divider: message đầu tiên không phải của mình sau unreadAnchor -----
  const { unreadDividerBeforeId, unreadCount } = useMemo(() => {
    if (!unreadAnchor) {
      return { unreadDividerBeforeId: null, unreadCount: 0 };
    }
    let dividerId: number | null = null;
    let count = 0;
    for (const message of messages) {
      if (message.senderId === currentUserId) continue;
      if (message.createdAt > unreadAnchor) {
        if (dividerId === null) dividerId = message.id;
        count += 1;
      }
    }
    return { unreadDividerBeforeId: dividerId, unreadCount: count };
  }, [messages, unreadAnchor, currentUserId]);

  const typingLabel = useMemo(() => {
    if (!typingUserIds || typingUserIds.length === 0) return null;

    const names = typingUserIds
      .map(
        (id) =>
          conversation.members.find((m) => m.user.id === id)?.user.fullName,
      )
      .filter((n): n is string => Boolean(n))
      .map((n) => n.split(" ").slice(-1)[0]);

    if (names.length === 0) {
      return t("pages.chat.someoneTyping");
    }

    if (names.length === 1) {
      return t("pages.chat.userTyping", { name: names[0] });
    }

    if (names.length === 2) {
      return t("pages.chat.twoUsersTyping", { n1: names[0], n2: names[1] });
    }

    return t("pages.chat.manyUsersTyping", {
      n1: names[0],
      n2: names[1],
      count: names.length - 2,
    });
  }, [typingUserIds, conversation.members]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 min-h-0 overflow-y-auto overscroll-contain messenger-thread-scroll flex flex-col ${
        compact ? "p-3 space-y-4 bg-white" : "p-6 space-y-6"
      }`}
    >
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="self-center text-xs font-bold text-primary hover:underline disabled:opacity-50 cursor-pointer"
        >
          {loading ? t("common.loading") : t("pages.chat.loadOlder")}
        </button>
      )}

      {groups.map((group) => (
        <div key={group.dateLabel} className="flex flex-col gap-1">
          <div className="self-center">
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                compact
                  ? "bg-[#f0f2f5] text-[#65676b]"
                  : "bg-surface-container-high text-on-surface-variant font-label"
              }`}
            >
              {group.dateLabel}
            </span>
          </div>

          {group.messages.map((message, index) => {
            if (message.contentType === "SYSTEM") {
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={false}
                  showAvatar={false}
                  showSenderName={false}
                  conversationType={conversation.type}
                />
              );
            }

            const isOwn = message.senderId === currentUserId;
            const prev = group.messages[index - 1];
            const isFirstFromSender =
              !prev ||
              prev.senderId !== message.senderId ||
              prev.contentType === "SYSTEM";

            const readers = isOwn
              ? readersByMessage.get(message.id)
              : undefined;
            const isLatestOwn = isOwn && message.id === latestOwnMessageId;
            const showUnreadDivider = message.id === unreadDividerBeforeId;

            return (
              <Fragment key={message.id}>
                {showUnreadDivider && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-primary/40" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {unreadCount > 1
                        ? t("pages.chat.unreadCount", { count: unreadCount })
                        : t("pages.chat.unreadSingle")}
                    </span>
                    <div className="flex-1 h-px bg-primary/40" />
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showAvatar={!isOwn && isFirstFromSender}
                  showSenderName={!isOwn && isGroup && isFirstFromSender}
                  readers={readers}
                  isLatestOwn={isLatestOwn}
                  conversationType={conversation.type}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  onPollVote={onPollVote}
                  compact={compact}
                />
              </Fragment>
            );
          })}
        </div>
      ))}

      {messages.length === 0 && !loading && (
        <div
          className={`m-auto text-center ${
            compact ? "text-[#65676b]" : "text-on-surface-variant"
          }`}
        >
          <p className="text-sm">{t("pages.chat.noMessageInConversation")}</p>
          <p className="text-xs mt-1">
            {t("pages.chat.startConversationHint")}
          </p>
        </div>
      )}

      {typingLabel && (
        <div
          className={`flex items-center gap-2 self-start px-3 py-2 rounded-2xl ${
            compact ? "bg-[#f0f2f5]" : "bg-surface-container"
          }`}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce [animation-delay:300ms]" />
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            {typingLabel}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageThread;
