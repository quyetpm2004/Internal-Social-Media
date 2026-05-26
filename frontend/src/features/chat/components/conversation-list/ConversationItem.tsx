import { Users } from "lucide-react";
import type {
  ChatMessage,
  Conversation,
} from "@/features/chat/types/chat.type";
import { formatConversationListTime } from "@/features/chat/utils/format-message-time";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: number;
  onClick: () => void;
}

const getLastMessagePreview = (
  lastMessage: ChatMessage | null,
  currentUserId: number,
  conversationType: Conversation["type"],
): { content: string; senderName?: string } => {
  if (!lastMessage) {
    return { content: "Chưa có tin nhắn" };
  }

  if (lastMessage.status === "DELETED") {
    return { content: "Tin nhắn đã bị thu hồi" };
  }

  let content = lastMessage.content;

  if (!content) {
    if (lastMessage.contentType === "IMAGE") content = "Đã gửi một hình ảnh";
    else if (lastMessage.contentType === "FILE")
      content = "Đã gửi một tệp đính kèm";
    else if (lastMessage.attachments.length > 0)
      content = "Đã gửi một tệp đính kèm";
  }

  const isOwnMessage = lastMessage.senderId === currentUserId;
  const senderName =
    conversationType === "GROUP" && !isOwnMessage
      ? lastMessage.sender.fullName.split(" ").slice(-1)[0]
      : isOwnMessage
        ? "Bạn"
        : undefined;

  return { content, senderName };
};

const ConversationItem = ({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: ConversationItemProps) => {
  const { type, name, avatarUrl, lastMessage, lastMessageAt, unreadCount } =
    conversation;

  const { content, senderName } = getLastMessagePreview(
    lastMessage,
    currentUserId,
    type,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-4 cursor-pointer transition-all border-l-4 ${
        isActive
          ? "bg-surface-container-lowest border-primary"
          : "border-transparent hover:bg-surface-container"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          {type === "GROUP" || !avatarUrl ? (
            <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center">
              <Users size={20} className="text-on-secondary-container" />
            </div>
          ) : (
            <img
              className="w-12 h-12 rounded-lg object-cover"
              src={avatarUrl}
              alt={name}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <h4 className="text-sm font-bold text-on-surface truncate">
              {name}
            </h4>
            {lastMessageAt && (
              <span className="text-[10px] font-medium text-on-surface-variant flex-shrink-0 ml-2">
                {formatConversationListTime(lastMessageAt)}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 mt-0.5">
            <p
              className={`text-xs truncate ${
                unreadCount > 0
                  ? "text-on-surface font-semibold"
                  : "text-on-surface-variant font-medium"
              }`}
            >
              {senderName && (
                <span className="text-on-surface">{senderName}: </span>
              )}
              {content}
            </p>

            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-primary text-[10px] flex items-center justify-center text-on-primary rounded-full font-bold flex-shrink-0">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
