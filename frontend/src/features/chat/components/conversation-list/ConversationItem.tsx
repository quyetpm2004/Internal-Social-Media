import { Users } from "lucide-react";
import type {
  ChatMessage,
  Conversation,
} from "@/features/chat/types/chat.type";
import { formatConversationListTime } from "@/features/chat/utils/format-message-time";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: number;
  isCounterpartOnline?: boolean;
  onClick: () => void;
}

const getLastMessagePreview = (
  lastMessage: ChatMessage | null,
  currentUserId: number,
  conversationType: Conversation["type"],
  t: (key: string, options?: Record<string, unknown>) => string,
): { content: string; senderName?: string } => {
  if (!lastMessage) {
    return { content: t("pages.chat.noMessage") };
  }

  if (lastMessage.status === "DELETED") {
    return { content: t("pages.chat.messageDeleted") };
  }

  if (lastMessage.contentType === "SYSTEM") {
    return { content: lastMessage.content };
  }

  let content = lastMessage.content;

  if (!content) {
    if (lastMessage.contentType === "IMAGE") content = t("pages.chat.sentImage");
    else if (lastMessage.contentType === "FILE")
      content = t("pages.chat.sentAttachment");
    else if (lastMessage.attachments.length > 0)
      content = t("pages.chat.sentAttachment");
  }

  const isOwnMessage = lastMessage.senderId === currentUserId;
  const senderName =
    conversationType === "GROUP" && !isOwnMessage
      ? lastMessage.sender.fullName.split(" ").slice(-1)[0]
      : isOwnMessage
        ? t("common.you")
        : undefined;

  return { content, senderName };
};

const ConversationItem = ({
  conversation,
  isActive,
  currentUserId,
  isCounterpartOnline,
  onClick,
}: ConversationItemProps) => {
  const { t } = useTranslation();
  const { type, name, avatarUrl, lastMessage, lastMessageAt, unreadCount } =
    conversation;

  const avatarUrlCounterPart = conversation.counterpart?.avatarUrl;

  const hasUnread = unreadCount > 0;

  const { content, senderName } = getLastMessagePreview(
    lastMessage,
    currentUserId,
    type,
    t,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        hasUnread
          ? `${name} (${unreadCount} ${t("pages.chat.unreadMessages")})`
          : name
      }
      className={`relative w-full text-left px-4 py-4 cursor-pointer transition-all border-l-4 ${
        isActive
          ? "bg-surface-container-lowest border-primary"
          : hasUnread
            ? "border-transparent bg-primary/5 hover:bg-primary/10"
            : "border-transparent hover:bg-surface-container"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          {type === "GROUP" ? (
            avatarUrl ? (
              <img
                className="w-12 h-12 rounded-full object-cover"
                src={avatarUrl}
                alt={name}
              />
            ) : (
              <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
                <Users size={20} className="text-on-secondary-container" />
              </div>
            )
          ) : (
            <img
              className="w-12 h-12 rounded-full object-cover"
              src={
                avatarUrlCounterPart ||
                getDefaultAvatarUrl(conversation.counterpart?.fullName)
              }
              alt={name}
            />
          )}

          {isCounterpartOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-container-low"
              aria-label={t("pages.chat.online")}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <h4
              className={`text-sm truncate ${
                hasUnread
                  ? "font-extrabold text-on-surface"
                  : "font-bold text-on-surface"
              }`}
            >
              {name}
            </h4>
            {lastMessageAt && (
              <span
                className={`text-[10px] shrink-0 ${
                  hasUnread
                    ? "text-primary font-bold"
                    : "text-on-surface-variant font-medium"
                }`}
              >
                {formatConversationListTime(lastMessageAt)}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 mt-0.5">
            <p
              className={`text-xs truncate ${
                hasUnread
                  ? "text-on-surface font-bold"
                  : "text-on-surface-variant font-medium"
              }`}
            >
              {senderName && (
                <span className="text-on-surface">{senderName}: </span>
              )}
              {content}
            </p>

            {hasUnread && (
              <span className="min-w-5 h-5 px-1.5 bg-primary text-[10px] flex items-center justify-center text-on-primary rounded-full font-bold shrink-0 shadow-sm">
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
