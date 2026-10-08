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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      className={`h-full min-h-0 w-full shrink-0 flex-col border-r border-slate-200/80 bg-white transition-all md:w-80 dark:border-slate-800 dark:bg-slate-900 ${className ?? "flex"}`}
    >
      <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("pages.chat.conversationsTitle")}
        </h2>
        <div className="flex items-center gap-2">
          {isSearchFocused && (
            <button
              type="button"
              className="cursor-pointer px-1 shrink-0"
              onClick={exitSearch}
              aria-label={t("common.back")}
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
            <>
            <p className="sr-only">{t("pages.chat.loadingConversation")}</p>
            <div className="space-y-2 px-3 py-3" aria-hidden>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex animate-pulse items-center gap-3 rounded-xl px-2 py-2">
                  <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-2.5 w-36 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : filteredConversations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              {t("pages.chat.noConversations")}
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
                {t("pages.chat.recentSearches")}
              </p>
              {histories.length === 0 ? (
                <p className="px-4 py-4 text-xs text-on-surface-variant">
                  {t("pages.chat.noSearchHistory")}
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
                  {t("pages.chat.searching")}
                </p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-6 text-xs text-on-surface-variant">
                  {t("pages.chat.noUsersFound")}
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
