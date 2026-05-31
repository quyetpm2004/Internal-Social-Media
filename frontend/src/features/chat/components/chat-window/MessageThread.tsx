import { Fragment, useEffect, useMemo, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type {
  ChatMessage,
  ChatUser,
  ConversationDetail,
} from "@/features/chat/types/chat.type";
import { groupMessagesByDate } from "@/features/chat/utils/format-message-time";

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
}: MessageThreadProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, conversation.id, typingUserIds?.length]);

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
      return "Ai đó đang nhập...";
    }

    if (names.length === 1) {
      return `${names[0]} đang nhập...`;
    }

    if (names.length === 2) {
      return `${names[0]} và ${names[1]} đang nhập...`;
    }

    return `${names[0]}, ${names[1]} và ${names.length - 2} người khác đang nhập...`;
  }, [typingUserIds, conversation.members]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="self-center text-xs font-bold text-primary hover:underline disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
        </button>
      )}

      {groups.map((group) => (
        <div key={group.dateLabel} className="flex flex-col gap-1">
          <div className="self-center">
            <span className="bg-surface-container-high px-4 py-1.5 rounded-full text-[10px] font-bold text-on-surface-variant font-label uppercase tracking-widest">
              {group.dateLabel}
            </span>
          </div>

          {group.messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const prev = group.messages[index - 1];
            const isFirstFromSender =
              !prev || prev.senderId !== message.senderId;

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
                        ? `${unreadCount} tin nhắn chưa đọc`
                        : "Tin nhắn chưa đọc"}
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
                />
              </Fragment>
            );
          })}
        </div>
      ))}

      {messages.length === 0 && !loading && (
        <div className="m-auto text-center text-on-surface-variant">
          <p className="text-sm">Chưa có tin nhắn nào trong cuộc trò chuyện</p>
          <p className="text-xs mt-1">
            Bắt đầu trò chuyện bằng cách gửi lời chào!
          </p>
        </div>
      )}

      {typingLabel && (
        <div className="flex items-center gap-2 self-start px-3 py-2 bg-surface-container rounded-2xl">
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
