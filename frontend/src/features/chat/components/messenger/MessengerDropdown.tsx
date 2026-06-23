import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Maximize2,
  MoreHorizontal,
  PenLine,
  Search,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMessenger } from "@/features/chat/context/MessengerContext";
import type { ConversationFilter } from "@/features/chat/types/chat.type";
import MessengerConversationItem from "./MessengerConversationItem";
import { useTranslation } from "react-i18next";

const MessengerDropdown = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id ?? 0);

  const {
    conversations,
    loadingConversations,
    onlineUserIds,
    openConversation,
    setDropdownOpen,
  } = useMessenger();

  const [filter, setFilter] = useState<ConversationFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const onlineSet = useMemo(() => new Set(onlineUserIds), [onlineUserIds]);
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    let list = conversations;

    switch (filter) {
      case "UNREAD":
        list = list.filter((item) => item.unreadCount > 0);
        break;
      case "GROUPS":
        list = list.filter((item) => item.type === "GROUP");
        break;
      default:
        break;
    }

    if (trimmedQuery) {
      list = list.filter((item) =>
        item.name.toLowerCase().includes(trimmedQuery),
      );
    }

    return list;
  }, [conversations, filter, trimmedQuery]);

  const filters: { value: ConversationFilter; label: string }[] = [
    { value: "ALL", label: t("pages.chat.filterAll") },
    { value: "UNREAD", label: t("pages.chat.filterUnread") },
    { value: "GROUPS", label: t("pages.chat.filterGroups") },
  ];

  return (
    <div className="absolute right-0 top-11 w-[min(100vw-2rem,360px)] rounded-xl bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 border border-[#e5e5e5]">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-bold text-2xl text-[#050505]">
          {t("pages.chat.conversationsTitle")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              navigate("/messages");
            }}
            className="p-2 rounded-full hover:bg-[#f2f2f2] text-[#0866ff] transition-colors"
            aria-label={t("pages.chat.openInMessenger")}
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65676b]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("pages.chat.messengerSearchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 bg-[#f0f2f5] border-none outline-none rounded-full text-sm text-[#050505] placeholder:text-[#65676b] focus:ring-1 focus:ring-[#0866ff]"
          />
        </div>
      </div>

      <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
              filter === item.value
                ? "bg-[#e7f3ff] text-[#0064d2]"
                : "text-[#050505] hover:bg-[#f2f2f2]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="max-h-[380px] overflow-y-auto messenger-scrollbar">
        {loadingConversations ? (
          <div className="flex items-center justify-center py-12 text-[#65676b]">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[#65676b]">
            {t("pages.chat.noConversations")}
          </p>
        ) : (
          filteredConversations.map((conversation) => (
            <MessengerConversationItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              isCounterpartOnline={
                conversation.type === "DIRECT" && conversation.counterpart
                  ? onlineSet.has(conversation.counterpart.id)
                  : false
              }
              onClick={() => openConversation(conversation.id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-[#e5e5e5] py-3">
        <button
          type="button"
          onClick={() => {
            setDropdownOpen(false);
            navigate("/messages");
          }}
          className="w-full text-center text-[#0866ff] text-[15px] font-medium hover:underline"
        >
          {t("pages.chat.seeAllInMessenger")}
        </button>
      </div>
    </div>
  );
};

export default MessengerDropdown;
