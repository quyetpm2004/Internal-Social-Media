import { useCallback, useEffect, useMemo, useState } from "react";
import ConversationFilters from "./ConversationFilters";
import ConversationItem from "./ConversationItem";
import type {
  Conversation,
  ConversationFilter,
} from "@/features/chat/types/chat.type";
import ConversationSearch from "./ConversationSearch";
import { ArrowLeft } from "lucide-react";
import ItemSearch from "./ItemSearch";
import { chatApi } from "@/features/chat/apis/chat.api";
import type {
  ChatSearchHistoryItem,
  ChatSearchUser,
} from "@/features/chat/types/chat-search.type";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: number;
  currentUserId: number;
  loading?: boolean;
  onlineUserIds?: number[];
  onSelectConversation: (conversationId: number) => void;
  onOpenUserChat: (userId: number) => Promise<void>;
  className?: string;
}

const ConversationList = ({
  conversations,
  activeConversationId,
  currentUserId,
  loading,
  onlineUserIds,
  onSelectConversation,
  onOpenUserChat,
  className,
}: ConversationListProps) => {
  const onlineSet = useMemo(
    () => new Set(onlineUserIds ?? []),
    [onlineUserIds],
  );
  const [filter, setFilter] = useState<ConversationFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [histories, setHistories] = useState<ChatSearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<ChatSearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openingUserId, setOpeningUserId] = useState<number | null>(null);

  const trimmedQuery = searchQuery.trim();

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

  const fetchHistory = useCallback(async () => {
    try {
      const res = await chatApi.getSearchHistory(10);
      setHistories(res.data);
    } catch {
      setHistories([]);
    }
  }, []);

  const fetchSearchResults = useCallback(async (q: string) => {
    if (!q) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const res = await chatApi.searchUsers(q, 1, 20);
      setSearchResults(res.data.users);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSearchFocused && !trimmedQuery) {
      fetchHistory();
    }
  }, [isSearchFocused, trimmedQuery, fetchHistory]);

  useEffect(() => {
    if (!isSearchFocused || !trimmedQuery) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSearchResults(trimmedQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [trimmedQuery, isSearchFocused, fetchSearchResults]);

  const exitSearch = () => {
    setIsSearchFocused(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSelectUser = async (userId: number) => {
    if (openingUserId !== null) return;

    try {
      setOpeningUserId(userId);
      await chatApi.saveSearchHistory(userId);
      await onOpenUserChat(userId);
      exitSearch();
    } catch {
      /* parent shows toast */
    } finally {
      setOpeningUserId(null);
    }
  };

  const handleDeleteHistory = async (
    e: React.MouseEvent,
    historyId: number,
  ) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSearchHistoryItem(historyId);
      setHistories((prev) => prev.filter((h) => h.id !== historyId));
    } catch {
      /* ignore */
    }
  };

  const mapUserForItem = (user: ChatSearchUser) => ({
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  return (
    <section
      className={`w-full md:w-80 flex-col bg-surface-container-low border-r border-outline-variant/30 transition-all shrink-0 ${className ?? "flex"}`}
    >
      <div className="p-4 space-y-4">
        <h2 className="font-headline font-extrabold text-xl tracking-tight text-on-surface">
          Đoạn chat
        </h2>
        <div className="flex items-center gap-2">
          {isSearchFocused && (
            <button
              type="button"
              className="cursor-pointer px-1 shrink-0"
              onClick={exitSearch}
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <ConversationSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFocus={handleFocus}
          />
        </div>
        {!isSearchFocused && (
          <ConversationFilters active={filter} onChange={setFilter} />
        )}
      </div>

      {!isSearchFocused && (
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
                isCounterpartOnline={
                  conversation.type === "DIRECT" && conversation.counterpart
                    ? onlineSet.has(conversation.counterpart.id)
                    : false
                }
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))
          )}
        </div>
      )}

      {isSearchFocused && (
        <div className="flex-1 overflow-y-auto">
          {!trimmedQuery ? (
            <>
              <p className="px-4 pb-2 text-sm font-medium text-on-surface-variant">
                Nội dung tìm kiếm gần đây
              </p>
              {histories.length === 0 ? (
                <p className="px-4 py-4 text-xs text-on-surface-variant">
                  Chưa có lịch sử tìm kiếm.
                </p>
              ) : (
                histories.map((item) => (
                  <ItemSearch
                    key={item.id}
                    user={mapUserForItem(item.user)}
                    showDeleteButton
                    onDelete={(e) => handleDeleteHistory(e, item.id)}
                    onClick={() => handleSelectUser(item.user.id)}
                  />
                ))
              )}
            </>
          ) : (
            <>
              {searchLoading ? (
                <p className="px-4 py-6 text-xs text-on-surface-variant">
                  Đang tìm kiếm...
                </p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-6 text-xs text-on-surface-variant">
                  Không tìm thấy người dùng nào.
                </p>
              ) : (
                searchResults.map((user) => (
                  <ItemSearch
                    key={user.id}
                    user={mapUserForItem(user)}
                    onClick={() => handleSelectUser(user.id)}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default ConversationList;
