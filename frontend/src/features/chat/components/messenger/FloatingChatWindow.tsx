import { Minus, Phone, Users, Video, X } from "lucide-react";
import MessageInput from "@/features/chat/components/chat-window/MessageInput";
import MessageThread from "@/features/chat/components/chat-window/MessageThread";
import type { ConversationDetail } from "@/features/chat/types/chat.type";
import type { WindowChatState } from "@/features/chat/context/MessengerContext";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface FloatingChatWindowProps {
  minimized: boolean;
  state: WindowChatState;
  currentUserId: number;
  onlineUserIds: number[];
  typingUserIds: number[];
  onMinimize: () => void;
  onClose: () => void;
  onLoadMore: () => void;
  onSendMessage: Parameters<typeof MessageInput>[0]["onSend"];
  onEditMessage: (messageId: number, content: string) => Promise<void>;
  onDeleteMessage: (messageId: number) => Promise<void>;
  onPollVote: (messageId: number, poll: import("@/types/poll.type").PollSummary) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

const FloatingChatHeader = ({
  conversation,
  isOnline,
  minimized,
  onMinimize,
  onClose,
}: {
  conversation: ConversationDetail;
  isOnline?: boolean;
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { type, name, avatarUrl } = conversation;
  const avatarUrlCounterPart = conversation.counterpart?.avatarUrl;

  return (
    <header
      className={`flex items-center justify-between px-3 bg-white cursor-pointer ${
        minimized ? "h-11 rounded-t-xl" : "h-14 border-b border-[#e5e5e5]"
      }`}
      onClick={minimized ? onMinimize : undefined}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e4e6eb] flex items-center justify-center">
            {type === "GROUP" ? (
              avatarUrl ? (
                <img
                  alt={name}
                  className="w-full h-full object-cover"
                  src={avatarUrl}
                />
              ) : (
                <Users size={14} className="text-[#65676b]" />
              )
            ) : (
              <img
                alt={name}
                className="w-full h-full object-cover"
                src={
                  avatarUrlCounterPart ||
                  getDefaultAvatarUrl(conversation.counterpart?.fullName)
                }
              />
            )}
          </div>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-[#050505] leading-tight truncate">
            {name}
          </h3>
          {!minimized && conversation.isMuted && (
            <span className="text-[11px] text-[#65676b]">
              {t("pages.chat.muteNotifications")}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {!minimized && (
          <>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-[#f2f2f2] text-[#0866ff] transition-colors"
              aria-label={t("pages.chat.voiceCall")}
            >
              <Phone size={16} />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-[#f2f2f2] text-[#0866ff] transition-colors"
              aria-label={t("pages.chat.videoCall")}
            >
              <Video size={16} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onMinimize}
          className="p-2 rounded-full hover:bg-[#f2f2f2] text-[#0866ff] transition-colors"
          aria-label={minimized ? t("pages.chat.expand") : t("pages.chat.minimize")}
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#f2f2f2] text-[#0866ff] transition-colors"
          aria-label={t("common.close")}
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
};

const FloatingChatWindow = ({
  minimized,
  state,
  currentUserId,
  onlineUserIds,
  typingUserIds,
  onMinimize,
  onClose,
  onLoadMore,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onPollVote,
  onTypingStart,
  onTypingStop,
}: FloatingChatWindowProps) => {
  const { t } = useTranslation();
  const { conversation, messages, loadingMessages, hasMoreMessages, sending, readReceipts, unreadAnchor } =
    state;

  const isCounterpartOnline = (() => {
    if (!conversation) return false;
    if (conversation.type === "DIRECT") {
      return conversation.counterpart
        ? onlineUserIds.includes(conversation.counterpart.id)
        : false;
    }
    return conversation.members.some(
      (m) => m.user.id !== currentUserId && onlineUserIds.includes(m.user.id),
    );
  })();

  return (
    <div
      className={`flex flex-col bg-white rounded-t-xl shadow-2xl border border-[#e5e5e5] border-b-0 overflow-hidden transition-all duration-200 ${
        minimized ? "w-[328px] h-11" : "w-[328px] h-[455px]"
      }`}
      data-messenger-dock
    >
      {conversation ? (
        <FloatingChatHeader
          conversation={conversation}
          isOnline={isCounterpartOnline}
          minimized={minimized}
          onMinimize={onMinimize}
          onClose={onClose}
        />
      ) : (
        <header className="h-14 flex items-center px-3 bg-white border-b border-[#e5e5e5]">
          <p className="text-sm text-[#65676b]">
            {t("pages.chat.loadingConversation")}
          </p>
        </header>
      )}

      {!minimized && conversation && (
        <>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
            <MessageThread
              conversation={conversation}
              messages={messages}
              currentUserId={currentUserId}
              loading={loadingMessages}
              hasMore={hasMoreMessages}
              typingUserIds={typingUserIds}
              readReceipts={readReceipts}
              unreadAnchor={unreadAnchor}
              onLoadMore={onLoadMore}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onPollVote={onPollVote}
              compact
            />
          </div>

          <div className="shrink-0 bg-white border-t border-[#e5e5e5]">
            <MessageInput
              onSend={onSendMessage}
              disabled={sending}
              onTypingStart={onTypingStart}
              onTypingStop={onTypingStop}
              compact
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingChatWindow;
