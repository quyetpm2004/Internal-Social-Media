import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageThread from "./MessageThread";
import type {
  ChatMessage,
  Conversation,
} from "@/features/chat/types/chat.type";

interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessage[];
  currentUserId: number;
  loadingMessages?: boolean;
  hasMoreMessages?: boolean;
  sending?: boolean;
  onLoadMore?: () => void;
  onSendMessage: (content: string) => void;
  onToggleDetails?: () => void;
}

const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  loadingMessages,
  hasMoreMessages,
  sending,
  onLoadMore,
  onSendMessage,
  onToggleDetails,
}: ChatWindowProps) => {
  return (
    <section className="flex-1 flex flex-col bg-surface-container-lowest min-w-0">
      <ChatHeader
        conversation={conversation}
        onToggleDetails={onToggleDetails}
      />

      <MessageThread
        conversation={conversation}
        messages={messages}
        currentUserId={currentUserId}
        loading={loadingMessages}
        hasMore={hasMoreMessages}
        onLoadMore={onLoadMore}
      />

      <MessageInput onSend={onSendMessage} disabled={sending} />
    </section>
  );
};

export default ChatWindow;
