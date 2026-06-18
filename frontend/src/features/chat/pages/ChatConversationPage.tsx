import { useOutletContext } from "react-router-dom";
import ChatWindow from "@/features/chat/components/chat-window/ChatWindow";
import DetailsPanel from "@/features/chat/components/details-panel/DetailsPanel";
import type { ChatOutletContext } from "@/features/chat/pages/ChatLayout";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const ChatConversationPage = () => {
  const { t } = useTranslation();
  const {
    conversation,
    messages,
    currentUserId,
    loadingMessages,
    hasMoreMessages,
    sending,
    onlineUserIds,
    typingUserIds,
    readReceipts,
    unreadAnchor,
    onLoadOlderMessages,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
    onPollVote,
    onMuteChanged,
    onConversationUpdated,
    onGroupCreated,
    onLeftGroup,
    onTypingStart,
    onTypingStop,
  } = useOutletContext<ChatOutletContext>();

  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);

  if (!conversation) {
    return (
      <section className="flex-1 flex items-center justify-center bg-surface-container-lowest">
        <p className="text-sm text-on-surface-variant">
          {loadingMessages
            ? t("pages.chat.loadingConversation")
            : t("pages.chat.conversationNotFound")}
        </p>
      </section>
    );
  }

  return (
    <>
      <ChatWindow
        conversation={conversation}
        messages={messages}
        currentUserId={currentUserId}
        loadingMessages={loadingMessages}
        hasMoreMessages={hasMoreMessages}
        sending={sending}
        onlineUserIds={onlineUserIds}
        typingUserIds={typingUserIds}
        readReceipts={readReceipts}
        unreadAnchor={unreadAnchor}
        onLoadMore={onLoadOlderMessages}
        onSendMessage={onSendMessage}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
        onPollVote={onPollVote}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        onToggleDetails={() => setShowDetailPanel((prev) => !prev)}
      />

      <DetailsPanel
        conversation={conversation}
        currentUserId={currentUserId}
        onMuteChanged={onMuteChanged}
        onConversationUpdated={onConversationUpdated}
        onGroupCreated={onGroupCreated}
        onLeftGroup={onLeftGroup}
        showDetailPanel={showDetailPanel}
      />
    </>
  );
};

export default ChatConversationPage;
