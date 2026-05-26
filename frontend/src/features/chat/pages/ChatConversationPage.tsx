import { useOutletContext } from "react-router-dom";
import ChatWindow from "@/features/chat/components/chat-window/ChatWindow";
import DetailsPanel from "@/features/chat/components/details-panel/DetailsPanel";
import type { ChatOutletContext } from "@/features/chat/pages/ChatLayout";
import { useState } from "react";

const ChatConversationPage = () => {
  const {
    conversation,
    messages,
    currentUserId,
    loadingMessages,
    hasMoreMessages,
    sending,
    onLoadOlderMessages,
    onSendMessage,
    onMuteChanged,
  } = useOutletContext<ChatOutletContext>();

  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);

  if (!conversation) {
    return (
      <section className="flex-1 flex items-center justify-center bg-surface-container-lowest">
        <p className="text-sm text-on-surface-variant">
          {loadingMessages
            ? "Đang tải cuộc trò chuyện..."
            : "Không tìm thấy cuộc trò chuyện."}
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
        onLoadMore={onLoadOlderMessages}
        onSendMessage={onSendMessage}
        onToggleDetails={() => setShowDetailPanel((prev) => !prev)}
      />

      <DetailsPanel
        conversation={conversation}
        onMuteChanged={onMuteChanged}
        showDetailPanel={showDetailPanel}
      />
    </>
  );
};

export default ChatConversationPage;
