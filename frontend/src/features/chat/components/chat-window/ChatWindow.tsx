import ChatHeader from "./ChatHeader";
import MessageInput, { type SendMessagePayload } from "./MessageInput";
import MessageThread from "./MessageThread";
import type {
  ChatMessage,
  ConversationDetail,
} from "@/features/chat/types/chat.type";
import type { PollSummary } from "@/types/poll.type";

interface ChatWindowProps {
  conversation: ConversationDetail;
  messages: ChatMessage[];
  currentUserId: number;
  loadingMessages?: boolean;
  hasMoreMessages?: boolean;
  sending?: boolean;
  onlineUserIds: number[];
  typingUserIds: number[];
  readReceipts?: Map<number, string>;
  unreadAnchor?: string | null;
  onLoadMore?: () => void;
  onSendMessage: (payload: SendMessagePayload) => Promise<void> | void;
  onEditMessage?: (messageId: number, content: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: number) => Promise<void> | void;
  onPollVote?: (messageId: number, poll: PollSummary) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onToggleDetails?: () => void;
}

const ChatWindow = ({
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
  onLoadMore,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onPollVote,
  onTypingStart,
  onTypingStop,
  onToggleDetails,
}: ChatWindowProps) => {
  const isCounterpartOnline = (() => {
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
    <section className="flex-1 flex flex-col bg-surface-container-lowest min-w-0">
      <ChatHeader
        conversation={conversation}
        isOnline={isCounterpartOnline}
        onToggleDetails={onToggleDetails}
      />

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
      />

      <MessageInput
        onSend={onSendMessage}
        disabled={sending}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </section>
  );
};

export default ChatWindow;
