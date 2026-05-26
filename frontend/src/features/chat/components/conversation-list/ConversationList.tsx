import { useMemo, useState } from "react";
import ConversationFilters from "./ConversationFilters";
import ConversationItem from "./ConversationItem";
import type {
  Conversation,
  ConversationFilter,
} from "@/features/chat/types/chat.type";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: number;
  currentUserId: number;
  loading?: boolean;
  onSelectConversation: (conversationId: number) => void;
  className?: string;
}

const ConversationList = ({
  conversations,
  activeConversationId,
  currentUserId,
  loading,
  onSelectConversation,
  className,
}: ConversationListProps) => {
  const [filter, setFilter] = useState<ConversationFilter>("ALL");

  const filteredConversations = useMemo(() => {
    switch (filter) {
      case "UNREAD":
        return conversations.filter((item) => item.unreadCount > 0);
      case "GROUPS":
        return conversations.filter((item) => item.type === "GROUP");
      default:
        return conversations;
    }
  }, [conversations, filter]);

  return (
    <section
      className={`w-full md:w-80 flex-col bg-surface-container-low border-r border-outline-variant/30 transition-all flex-shrink-0 ${className ?? "flex"}`}
    >
      <div className="p-4 space-y-4">
        <h2 className="font-headline font-extrabold text-xl tracking-tight text-on-surface">
          Đoạn chat
        </h2>

        <ConversationFilters active={filter} onChange={setFilter} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-xs text-on-surface-variant">
            Đang tải cuộc trò chuyện...
          </p>
        ) : filteredConversations.length === 0 ? (
          <p className="px-4 py-6 text-xs text-on-surface-variant">
            Không có cuộc trò chuyện nào.
          </p>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              currentUserId={currentUserId}
              onClick={() => onSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default ConversationList;
