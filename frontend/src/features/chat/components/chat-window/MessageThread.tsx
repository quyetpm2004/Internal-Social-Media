import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type {
  ChatMessage,
  Conversation,
} from "@/features/chat/types/chat.type";
import { groupMessagesByDate } from "@/features/chat/utils/format-message-time";

interface MessageThreadProps {
  conversation: Conversation;
  messages: ChatMessage[];
  currentUserId: number;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const MessageThread = ({
  conversation,
  messages,
  currentUserId,
  loading,
  hasMore,
  onLoadMore,
}: MessageThreadProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, conversation.id]);

  const groups = groupMessagesByDate(messages);

  const isGroup = conversation.type === "GROUP";

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
        <div key={group.dateLabel} className="flex flex-col gap-4">
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

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={!isOwn && isFirstFromSender}
                showSenderName={!isOwn && isGroup && isFirstFromSender}
              />
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

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageThread;
