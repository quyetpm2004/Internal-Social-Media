import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMessenger } from "@/features/chat/context/MessengerContext";
import FloatingChatWindow from "./FloatingChatWindow";

const MessengerDock = () => {
  const currentUserId = useAuthStore((state) => state.user?.id ?? 0);

  const {
    openWindows,
    windowStates,
    onlineUserIds,
    showDock,
    closeConversation,
    toggleMinimize,
    getTypingUserIds,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    onPollVote,
    onTypingStart,
    onTypingStop,
  } = useMessenger();

  if (!showDock || openWindows.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 right-4 z-40 flex items-end gap-2 pointer-events-none"
      data-messenger-dock
    >
      {openWindows.map((window) => {
        const state =
          windowStates[window.conversationId] ?? {
            conversation: null,
            messages: [],
            loadingMessages: true,
            hasMoreMessages: false,
            nextCursor: null,
            sending: false,
            readReceipts: new Map(),
            unreadAnchor: null,
          };

        return (
          <div key={window.conversationId} className="pointer-events-auto">
            <FloatingChatWindow
              minimized={window.minimized}
              state={state}
              currentUserId={currentUserId}
              onlineUserIds={onlineUserIds}
              typingUserIds={getTypingUserIds(window.conversationId)}
              onMinimize={() => toggleMinimize(window.conversationId)}
              onClose={() => closeConversation(window.conversationId)}
              onLoadMore={() => loadOlderMessages(window.conversationId)}
              onSendMessage={(payload) =>
                sendMessage(window.conversationId, payload)
              }
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onPollVote={onPollVote}
              onTypingStart={() => onTypingStart(window.conversationId)}
              onTypingStop={() => onTypingStop(window.conversationId)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MessengerDock;
