import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ReactionApi,
  type PostReactionUser,
  type ReactionSummary,
  type ReactionType,
} from "@/features/new-feed/api/reaction.api";
import { chatApi } from "@/features/chat/apis/chat.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getDefaultAvatarUrl } from "@/lib/utils";

type PostReactionsModalProps = {
  postId: number;
  open: boolean;
  onClose: () => void;
  initialSummary?: ReactionSummary;
};

type ReactionTab = "ALL" | ReactionType;

const emptyReactionSummary = (): ReactionSummary => ({
  LIKE: 0,
  LOVE: 0,
  HAHA: 0,
  WOW: 0,
  SAD: 0,
  ANGRY: 0,
});

const reactionOptions: {
  type: ReactionType;
  icon: string;
}[] = [
  { type: "LIKE", icon: "/icons/like.png" },
  { type: "LOVE", icon: "/icons/love.png" },
  { type: "HAHA", icon: "/icons/haha.png" },
  { type: "WOW", icon: "/icons/wow.png" },
  { type: "SAD", icon: "/icons/sad.png" },
  { type: "ANGRY", icon: "/icons/angry.png" },
];

const PostReactionsModal = ({
  postId,
  open,
  onClose,
  initialSummary,
}: PostReactionsModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [activeTab, setActiveTab] = useState<ReactionTab>("ALL");
  const [summary, setSummary] = useState<ReactionSummary>(
    initialSummary ?? emptyReactionSummary(),
  );
  const [items, setItems] = useState<PostReactionUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messagingUserId, setMessagingUserId] = useState<number | null>(null);

  const fetchReactions = async (
    tab: ReactionTab,
    pageNum: number,
    append = false,
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await ReactionApi.getPostReactions(postId, {
        page: pageNum,
        limit: 20,
        reactionType: tab === "ALL" ? undefined : tab,
      });
      const data = res.data;

      setSummary(data.summary);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
    } catch (error: any) {
      console.error("Fetch post reactions failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setActiveTab("ALL");
    setSummary(initialSummary ?? emptyReactionSummary());
    fetchReactions("ALL", 1, false);
  }, [open, postId]);

  const handleTabChange = (tab: ReactionTab) => {
    if (tab === activeTab || loading) return;
    setActiveTab(tab);
    fetchReactions(tab, 1, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    fetchReactions(activeTab, page + 1, true);
  };

  const handleMessage = async (userId: number) => {
    if (messagingUserId) return;

    try {
      setMessagingUserId(userId);
      const res = await chatApi.createDirectConversation(userId);
      const conversation = res.data;
      onClose();
      navigate(`/messages/${conversation.id}`);
    } catch (error: any) {
      console.error("Open chat failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    } finally {
      setMessagingUserId(null);
    }
  };

  if (!open) return null;

  const totalCount = Object.values(summary).reduce(
    (acc, count) => acc + count,
    0,
  );

  const tabs: {
    key: ReactionTab;
    count: number;
    icon?: string;
    label?: string;
  }[] = [
    { key: "ALL", count: totalCount, label: t("pages.posts.reactionsAll") },
    ...reactionOptions
      .filter((item) => summary[item.type] > 0)
      .map((item) => ({
        key: item.type,
        count: summary[item.type],
        icon: item.icon,
      })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[min(80vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t("pages.posts.reactionsTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1 overflow-x-auto px-2 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.icon ? (
                  <img
                    src={tab.icon}
                    alt=""
                    className="h-4 w-4 object-contain"
                  />
                ) : (
                  <span>{tab.label}</span>
                )}
                <span className="text-xs font-semibold text-slate-500">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              {t("common.loading")}
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              {t("pages.posts.noReactions")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => {
                const reactionIcon = reactionOptions.find(
                  (option) => option.type === item.reactionType,
                )?.icon;
                const avatarUrl =
                  item.user.profile?.avatarUrl ||
                  getDefaultAvatarUrl(item.user.fullName);
                const isSelf = item.user.id === currentUserId;

                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={avatarUrl}
                        alt={item.user.fullName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      {reactionIcon && (
                        <img
                          src={reactionIcon}
                          alt=""
                          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border border-white dark:border-slate-900 bg-white object-contain"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.user.fullName}
                      </p>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        disabled={messagingUserId === item.user.id}
                        onClick={() => handleMessage(item.user.id)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <MessageCircle size={14} />
                        {t("pages.posts.message")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore && (
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full rounded-lg py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-blue-900/20"
              >
                {loadingMore ? t("common.loading") : t("common.viewMore")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostReactionsModal;
