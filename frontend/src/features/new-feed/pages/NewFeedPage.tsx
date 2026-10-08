import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/features/new-feed/types/post.type";
import PostCreator from "@/features/new-feed/components/PostCreator";
import PostCard from "@/features/new-feed/components/PostCard";
import { Bell, Calendar, Loader2, Newspaper, Pin, Users2 } from "lucide-react";
import RightSidebarWidget from "@/features/new-feed/components/RightSidebarWidget";
import GroupItem from "@/features/new-feed/components/GroupItem";
import { PostsApi } from "@/features/new-feed/api/post.api";
import { mapApiPostToPostCard, formatTimeAgo } from "@/utils/formatTimeAgo";
import { toast } from "sonner";
import type { Group } from "@/features/group/types/group.type";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useTranslation } from "react-i18next";
import { notificationApi } from "@/features/notification/api/notification.api";
import type { AppNotification } from "@/features/notification/types/notification.type";
import {
  getNotificationLink,
  getNotificationMessage,
} from "@/features/notification/utils/notification-message.tsx";
import { eventApi } from "@/features/event/api/event.api";
import type { UpcomingEventSummary } from "@/features/event/api/event.api";

type SortType = "latest" | "trending";
const LIMIT = 10;

const formatEventDateParts = (iso: string) => {
  const date = new Date(iso);
  return {
    monthLabel: `Th.${date.getMonth() + 1}`,
    day: date.getDate(),
  };
};

const formatEventMeta = (event: UpcomingEventSummary, locale: string) => {
  const time = new Date(event.startAt).toLocaleTimeString(
    locale === "vi" ? "vi-VN" : "en-US",
    { hour: "2-digit", minute: "2-digit" },
  );
  return [event.location, time].filter(Boolean).join(" • ");
};

const FeedSkeleton = () => (
  <div className="space-y-4" aria-hidden>
    {[0, 1].map((item) => (
      <div
        key={item}
        className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-2.5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-4/5 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    ))}
  </div>
);

const NewFeedPage = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [sort] = useState<SortType>("latest");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<
    AppNotification[]
  >([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEventSummary[]>(
    [],
  );
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canPinPost = user?.role === "ADMIN";

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // lock thật sự để chặn gọi API trùng
  const isFetchingRef = useRef(false);

  // giữ state mới nhất cho observer
  const hasMoreRef = useRef(hasMore);
  const initialLoadingRef = useRef(initialLoading);
  const pageRef = useRef(page);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    initialLoadingRef.current = initialLoading;
  }, [initialLoading]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchPosts = useCallback(
    async (currentPage: number) => {
      if (isFetchingRef.current) return;
      if (!hasMoreRef.current && currentPage > 1) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);

        const response = await PostsApi.getPostInNewFeed(
          currentPage,
          LIMIT,
          sort,
        );

        const responseData = response.data;

        const mappedPinned = (responseData.pinnedPosts || []).map(
          mapApiPostToPostCard,
        );
        const mappedPosts = (responseData.posts || []).map(
          mapApiPostToPostCard,
        );

        if (currentPage === 1) {
          setPinnedPosts(mappedPinned);
          setPosts(mappedPosts);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const filtered = mappedPosts.filter(
              (item) => !existingIds.has(item.id),
            );
            return [...prev, ...filtered];
          });
        }

        setHasMore(Boolean(responseData.hasMore));
      } catch (error: any) {
        console.error("Failed to fetch posts:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("common.genericError");
        toast.error(message);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [sort],
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    const observerTarget = loadMoreRef.current;
    if (!observerTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (
          firstEntry?.isIntersecting &&
          !isFetchingRef.current &&
          hasMoreRef.current &&
          !initialLoadingRef.current
        ) {
          setPage((prev) => {
            const nextPage = prev + 1;
            pageRef.current = nextPage;
            return nextPage;
          });
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      },
    );

    observer.observe(observerTarget);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (page === 1) return;
    fetchPosts(page);
  }, [page, fetchPosts]);

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const response = await PostsApi.getMyGroups();
        setMyGroups(response.data.groups);
      } catch (error: any) {
        console.error("Error fetching my groups:", error);
        toast.error(error.message || error.response.message);
      }
    };

    fetchMyGroups();
  }, []);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const [notificationsRes, eventsRes] = await Promise.all([
          notificationApi.list({ page: 1, limit: 3 }),
          eventApi.listUpcoming(),
        ]);
        setRecentNotifications(notificationsRes.data.notifications);
        setUpcomingEvents(eventsRes.data.events);
      } catch (error: unknown) {
        console.error("Failed to load sidebar data:", error);
      }
    };

    fetchSidebarData();
  }, []);

  const handleCopyPostLink = (postId: number) => {
    const postLink = `${import.meta.env.VITE_BASE_URL_FRONTEND}/news-feed/${postId}`;
    navigator.clipboard.writeText(postLink);
    toast.success(t("pages.posts.copyLinkSuccess"));
  };

  const handlePinPost = async (
    postId: number,
    pinGroupId: number | null,
    willPin: boolean,
  ) => {
    try {
      await PostsApi.pinPost(postId, pinGroupId, willPin);
      setPage(1);
      pageRef.current = 1;
      await fetchPosts(1);
      toast.success(
        willPin ? t("pages.posts.pinSuccess") : t("pages.posts.unpinSuccess"),
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t("common.genericError");
      toast.error(message);
    }
  };

  const renderPost = (post: Post) => (
    <PostCard
      key={post.id}
      {...post}
      onDeleted={(postId) => {
        setPosts((prev) => prev.filter((item) => item.id !== postId));
        setPinnedPosts((prev) => prev.filter((item) => item.id !== postId));
      }}
      onUpdated={(postId, newContent, newFormat) => {
        const updater = (prev: Post[]) =>
          prev.map((item) =>
            item.id === postId
              ? { ...item, content: newContent, contentFormat: newFormat }
              : item,
          );
        setPosts(updater);
        setPinnedPosts(updater);
      }}
      onCopied={handleCopyPostLink}
      onSavedChanged={(postId, isSaved) => {
        const updater = (prev: Post[]) =>
          prev.map((item) =>
            item.id === postId ? { ...item, isSaved } : item,
          );
        setPosts(updater);
        setPinnedPosts(updater);
      }}
      canPinPost={canPinPost}
      pinGroupId={null}
      onPinned={handlePinPost}
    />
  );

  const displayName = user?.fullName?.trim();
  const todayLabel = new Date().toLocaleDateString(
    i18n.language.startsWith("vi") ? "vi-VN" : "en-US",
    { weekday: "long", day: "numeric", month: "long" },
  );
  const visibleGroups = myGroups.slice(0, 5);

  return (
    <main className="flex-1 px-3 py-6 sm:px-5 md:py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        <section className="min-w-0 space-y-4">
          <header className="px-1">
            <p className="text-xs font-medium capitalize tracking-wide text-blue-700">
              {todayLabel}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {displayName
                ? t("pages.newsFeed.greeting", { name: displayName })
                : t("pages.newsFeed.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("pages.newsFeed.subtitle")}
            </p>
          </header>

          <PostCreator fetchPosts={fetchPosts} groupVisibility="PUBLIC" />

          {initialLoading && (
            <>
              <p className="sr-only">{t("pages.newsFeed.loadingFeed")}</p>
              <FeedSkeleton />
            </>
          )}

          {!initialLoading && pinnedPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Pin size={13} className="fill-current" />
                {t("pages.newsFeed.pinnedLabel")}
              </div>
              <div className="space-y-4">{pinnedPosts.map(renderPost)}</div>
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-4">{posts.map(renderPost)}</div>
          )}

          {!initialLoading &&
            posts.length === 0 &&
            pinnedPosts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40">
                  <Newspaper size={22} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("pages.newsFeed.empty")}
                </p>
              </div>
            )}

          {loading && !initialLoading && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("pages.newsFeed.loadingMore")}
            </div>
          )}

          {!hasMore && !initialLoading && posts.length > 0 && (
            <div className="flex items-center gap-3 py-2 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              {t("pages.newsFeed.noMore")}
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
          )}

          <div ref={loadMoreRef} className="h-8" />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <RightSidebarWidget
            title={t("pages.newsFeed.yourGroups")}
            icon={Users2}
            action={
              <button
                type="button"
                onClick={() => navigate("/groups")}
                className="shrink-0 text-xs font-semibold text-blue-700 hover:underline"
              >
                {t("pages.newsFeed.viewAllGroups")}
              </button>
            }
          >
            {visibleGroups.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500">
                {t("pages.newsFeed.noGroups")}
              </p>
            ) : (
              <div className="space-y-0.5">
                {visibleGroups.map((item) => (
                  <GroupItem
                    key={item.id}
                    id={item.id}
                    name={item.groupName}
                    members={item._count.members}
                    url={item.coverUrl}
                  />
                ))}
              </div>
            )}
          </RightSidebarWidget>

          <RightSidebarWidget
            title={t("pages.newsFeed.recentNotifications")}
            icon={Bell}
          >
            {recentNotifications.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500">
                {t("pages.newsFeed.noRecentNotifications")}
              </p>
            ) : (
              <div className="space-y-0.5">
                {recentNotifications.map((notification) => {
                  const isUnread = !notification.readAt;
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        navigate(getNotificationLink(notification))
                      }
                      className={`flex w-full gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                        isUnread ? "bg-blue-50/70 dark:bg-blue-950/30" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          isUnread ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                      <span className="min-w-0">
                        <span
                          className={`block text-xs leading-snug text-slate-800 dark:text-slate-200 ${
                            isUnread ? "font-medium" : ""
                          }`}
                        >
                          {getNotificationMessage(notification, t)}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-500">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </RightSidebarWidget>

          <RightSidebarWidget
            title={t("pages.newsFeed.upcomingEvents")}
            icon={Calendar}
          >
            {upcomingEvents.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500">
                {t("pages.newsFeed.noUpcomingEvents")}
              </p>
            ) : (
              <div className="space-y-0.5">
                {upcomingEvents.map((event) => {
                  const { monthLabel, day } = formatEventDateParts(
                    event.startAt,
                  );
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        if (event.groupId) {
                          navigate(
                            `/groups/${event.groupId}/posts/${event.postId}`,
                          );
                        } else {
                          navigate(`/news-feed/${event.postId}`);
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40">
                        <span className="text-[10px] font-semibold uppercase leading-none">
                          {monthLabel}
                        </span>
                        <span className="mt-0.5 text-base font-bold leading-none">
                          {day}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {event.title}
                        </h4>
                        <p className="truncate text-xs text-slate-500">
                          {formatEventMeta(event, i18n.language)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </RightSidebarWidget>
        </aside>
      </div>
    </main>
  );
};

export default NewFeedPage;
