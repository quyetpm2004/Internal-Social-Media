import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/features/new-feed/types/post.type";
import PostCreator from "@/features/new-feed/components/PostCreator";
import PostCard from "@/features/new-feed/components/PostCard";
import { Bell, Cake, Calendar, Users2 } from "lucide-react";
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

const formatEventMeta = (
  event: UpcomingEventSummary,
  locale: string,
) => {
  const time = new Date(event.startAt).toLocaleTimeString(
    locale === "vi" ? "vi-VN" : "en-US",
    { hour: "2-digit", minute: "2-digit" },
  );
  return [event.location, time].filter(Boolean).join(" • ");
};

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
          // Không khóa ở đây
          // chỉ tăng page nếu chưa có request đang chạy
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

  return (
    <main className="flex-1 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <PostCreator fetchPosts={fetchPosts} groupVisibility="PUBLIC" />

          {initialLoading && (
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              {t("pages.newsFeed.loadingFeed")}
            </div>
          )}

          {!initialLoading && pinnedPosts.length > 0 && (
            <div className="space-y-6">
              {pinnedPosts.map((post) => (
                <PostCard
                  key={`pinned-${post.id}`}
                  {...post}
                  onDeleted={(postId) => {
                    setPosts((prev) =>
                      prev.filter((item) => item.id !== postId),
                    );
                    setPinnedPosts((prev) =>
                      prev.filter((item) => item.id !== postId),
                    );
                  }}
                  onUpdated={(postId, newContent, newFormat) => {
                    const updater = (prev: Post[]) =>
                      prev.map((item) =>
                        item.id === postId
                          ? {
                              ...item,
                              content: newContent,
                              contentFormat: newFormat,
                            }
                          : item,
                      );
                    setPosts(updater);
                    setPinnedPosts(updater);
                  }}
                  onCopied={(postId) => handleCopyPostLink(postId)}
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
              ))}
            </div>
          )}

          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                onDeleted={(postId) => {
                  setPosts((prev) => prev.filter((item) => item.id !== postId));
                  setPinnedPosts((prev) =>
                    prev.filter((item) => item.id !== postId),
                  );
                }}
                onUpdated={(postId, newContent, newFormat) => {
                  const updater = (prev: Post[]) =>
                    prev.map((item) =>
                      item.id === postId
                        ? {
                            ...item,
                            content: newContent,
                            contentFormat: newFormat,
                          }
                        : item,
                    );
                  setPosts(updater);
                  setPinnedPosts(updater);
                }}
                onCopied={(postId) => handleCopyPostLink(postId)}
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
            ))}
          </div>

          {!initialLoading &&
            posts.length === 0 &&
            pinnedPosts.length === 0 && (
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                {t("pages.newsFeed.empty")}
              </div>
            )}

          {loading && !initialLoading && (
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              {t("pages.newsFeed.loadingMore")}
            </div>
          )}

          {!hasMore && !initialLoading && posts.length > 0 && (
            <div className="text-center text-sm text-slate-500 py-2">
              {t("pages.newsFeed.noMore")}
            </div>
          )}

          <div ref={loadMoreRef} className="h-10" />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <RightSidebarWidget title={t("pages.newsFeed.yourGroups")} icon={Users2}>
            <div className="space-y-4">
              {myGroups.map((item) => (
                <GroupItem
                  key={item.id}
                  id={item.id}
                  name={item.groupName}
                  members={item._count.members}
                  url={item.coverUrl}
                />
              ))}
            </div>
            <button
              onClick={() => navigate("/groups")}
              className="w-full mt-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-dashed border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              {t("pages.newsFeed.viewAllGroups")}
            </button>
          </RightSidebarWidget>

          <RightSidebarWidget title={t("pages.newsFeed.recentNotifications")} icon={Bell}>
            {recentNotifications.length === 0 ? (
              <p className="text-xs text-slate-500">
                {t("pages.newsFeed.noRecentNotifications")}
              </p>
            ) : (
              <div className="space-y-4">
                {recentNotifications.map((notification) => {
                  const isUnread = !notification.readAt;
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        navigate(getNotificationLink(notification))
                      }
                      className="w-full flex gap-3 text-left hover:opacity-80 transition-opacity"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          isUnread ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-xs leading-snug ${
                            isUnread ? "font-medium" : ""
                          }`}
                        >
                          {getNotificationMessage(notification, t)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </RightSidebarWidget>

          <RightSidebarWidget title={t("pages.newsFeed.upcomingEvents")} icon={Calendar}>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-500">
                {t("pages.newsFeed.noUpcomingEvents")}
              </p>
            ) : (
              <div className="space-y-4">
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
                      className="w-full flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0">
                        <span className="text-[10px] font-bold text-blue-700 uppercase">
                          {monthLabel}
                        </span>
                        <span className="text-lg font-bold">{day}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate">
                          {event.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {formatEventMeta(event, i18n.language)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </RightSidebarWidget>

          <RightSidebarWidget title={t("pages.newsFeed.birthdays")} icon={Cake}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkbItoWEKJD1P7vjxukWlrSwklmQ0tFqijb6DKbjWUf5-g6_7xyJYkW2zBVwx6Gux6Ce-J0psux77L9GqVvgxbvo1PAjw40_re0Zjoiv5ZDhMDx_DOFjktBdO-Fn8M__JJ0RljPPckOz2dASeeW3JWQESTVJilaj69mFeTH5_pUZWPuVsF9dhv--GlXMivFjDRunyNApgNcK4inbTmNoBbwGM7rNJRD7Tvn8V8OP5cb7d6euVZseeCTgphTOu333TIkjinvw5lprk"
                    alt="Birthday"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Julie Watson</h4>
                  <p className="text-[10px] text-slate-500">{t("pages.newsFeed.today")}</p>
                </div>
              </div>

              <button className="text-[10px] font-bold text-blue-700 hover:underline">
                {t("pages.newsFeed.sendWish")}
              </button>
            </div>
          </RightSidebarWidget>
        </div>
      </div>
    </main>
  );
};

export default NewFeedPage;
