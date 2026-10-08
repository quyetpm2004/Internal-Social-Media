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
      className={`relative mx-2 my-0.5 w-[calc(100%-1rem)] cursor-pointer rounded-xl px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-blue-50 dark:bg-blue-950/40"
          : hasUnread
            ? "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
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
              className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
              aria-label={t("pages.chat.online")}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <h4
              className={`truncate text-sm text-slate-900 dark:text-slate-100 ${
                hasUnread ? "font-semibold" : "font-medium"
              }`}
            >
              {name}
            </h4>
            {lastMessageAt && (
              <span
                className={`shrink-0 text-[11px] ${
                  hasUnread
                    ? "font-semibold text-blue-700"
                    : "font-medium text-slate-400"
                }`}
              >
                {formatConversationListTime(lastMessageAt)}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 mt-0.5">
            <p
              className={`truncate text-xs ${
                hasUnread
                  ? "font-medium text-slate-800 dark:text-slate-200"
                  : "text-slate-500"
              }`}
            >
              {senderName && (
                <span className="text-on-surface">{senderName}: </span>
              )}
              {content}
            </p>

            {hasUnread && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
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
