import { BellOff, Users } from "lucide-react";
import type {
  ChatMessage,
  Conversation,
} from "@/features/chat/types/chat.type";
import { formatConversationListTime } from "@/features/chat/utils/format-message-time";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MessengerConversationItemProps {
  conversation: Conversation;
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

const MessengerConversationItem = ({
  conversation,
  currentUserId,
  isCounterpartOnline,
  onClick,
}: MessengerConversationItemProps) => {
  const { t } = useTranslation();
  const { type, name, avatarUrl, lastMessage, lastMessageAt, unreadCount, isMuted } =
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
      className="group w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f2f2f2] transition-colors rounded-lg mx-1"
      style={{ width: "calc(100% - 0.5rem)" }}
    >
      <div className="relative shrink-0">
        {type === "GROUP" ? (
          avatarUrl ? (
            <img
              className="w-14 h-14 rounded-full object-cover"
              src={avatarUrl}
              alt={name}
            />
          ) : (
            <div className="w-14 h-14 bg-[#e4e6eb] rounded-full flex items-center justify-center">
              <Users size={22} className="text-[#65676b]" />
            </div>
          )
        ) : (
          <img
            className="w-14 h-14 rounded-full object-cover"
            src={
              avatarUrlCounterPart ||
              getDefaultAvatarUrl(conversation.counterpart?.fullName)
            }
            alt={name}
          />
        )}

        {isCounterpartOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-[15px] truncate text-[#050505] ${
              hasUnread ? "font-bold" : "font-semibold"
            }`}
          >
            {name}
          </h4>
          {lastMessageAt && (
            <span className="text-xs text-[#65676b] shrink-0">
              {formatConversationListTime(lastMessageAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-[13px] truncate ${
              hasUnread
                ? "text-[#050505] font-semibold"
                : "text-[#65676b] font-normal"
            }`}
          >
            {senderName && <span>{senderName}: </span>}
            {content}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {isMuted && (
              <BellOff size={14} className="text-[#65676b]" />
            )}
            {hasUnread && (
              <span className="min-w-5 h-5 px-1.5 bg-[#0866ff] text-[11px] flex items-center justify-center text-white rounded-full font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default MessengerConversationItem;
