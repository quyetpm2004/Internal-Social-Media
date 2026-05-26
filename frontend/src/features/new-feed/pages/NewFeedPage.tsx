import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/features/new-feed/types/new-feed.type";
import PostCreator from "@/features/new-feed/components/PostCreator";
import PostCard from "@/features/new-feed/components/PostCard";
import {
  Bell,
  Cake,
  Calendar,
  DraftingCompass,
  Globe,
  Hash,
  Users2,
  Zap,
} from "lucide-react";
import RightSidebarWidget from "@/features/new-feed/components/RightSidebarWidget";
import GroupItem from "@/features/new-feed/components/GroupItem";
import { PostsApi } from "@/features/new-feed/api/new-feed.api";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { toast } from "sonner";

type SortType = "latest" | "trending";
const LIMIT = 10;

const NewFeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [sort] = useState<SortType>("latest");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

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
        console.error("Lỗi khi lấy danh sách bài viết:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Có lỗi xảy ra. Vui lòng thử lại.";
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

  const handleCopyPostLink = (postId: number) => {
    const postLink = `${import.meta.env.VITE_BASE_URL_FRONTEND}/news-feed/${postId}`;
    navigator.clipboard.writeText(postLink);
    toast.success("Đã sao chép liên kết bài viết");
  };

  return (
    <main className="flex-1 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <PostCreator fetchPosts={fetchPosts} groupVisibility="PUBLIC" />

          {initialLoading && (
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              Đang tải bảng tin...
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
                }}
                onUpdated={(postId, newContent, newFormat) => {
                  setPosts((prev) =>
                    prev.map((item) =>
                      item.id === postId
                        ? {
                            ...item,
                            content: newContent,
                            contentFormat: newFormat,
                          }
                        : item,
                    ),
                  );
                }}
                onCopied={(postId) => handleCopyPostLink(postId)}
              />
            ))}
          </div>

          {!initialLoading &&
            posts.length === 0 &&
            pinnedPosts.length === 0 && (
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                Chưa có bài viết nào.
              </div>
            )}

          {loading && !initialLoading && (
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              Đang tải thêm bài viết...
            </div>
          )}

          {!hasMore && !initialLoading && posts.length > 0 && (
            <div className="text-center text-sm text-slate-500 py-2">
              Đã hiển thị hết bài viết
            </div>
          )}

          <div ref={loadMoreRef} className="h-10" />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <RightSidebarWidget title="Các nhóm của bạn" icon={Users2}>
            <div className="space-y-4">
              <GroupItem
                name="Thiết kế bền vững"
                members={42}
                unread={3}
                iconBg="bg-emerald-500"
                icon={Zap}
              />
              <GroupItem
                name="Dự án Green Hub"
                members={128}
                iconBg="bg-blue-600"
                icon={DraftingCompass}
              />
              <GroupItem
                name="Cộng đồng Kỹ sư"
                members={850}
                unread={12}
                iconBg="bg-indigo-500"
                icon={Globe}
              />
              <GroupItem
                name="Vật liệu tương lai"
                members={24}
                iconBg="bg-orange-500"
                icon={Hash}
              />
            </div>
            <button className="w-full mt-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-dashed border-blue-200 dark:border-blue-800 cursor-pointer">
              Xem tất cả nhóm
            </button>
          </RightSidebarWidget>

          <RightSidebarWidget title="Thông báo gần đây" icon={Bell}>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">
                  Marcus đã gắn thẻ bạn trong một bình luận về "Dự án Atlas".
                </p>
                <p className="text-[10px] text-slate-500 mt-1">10 phút trước</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs">
                  Nhắc lịch: Cuộc họp Weekly Sync bắt đầu trong 30 phút nữa.
                </p>
                <p className="text-[10px] text-slate-500 mt-1">3 giờ trước</p>
              </div>
            </div>
          </RightSidebarWidget>

          <RightSidebarWidget title="Sự kiện sắp tới" icon={Calendar}>
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0">
                <span className="text-[10px] font-bold text-blue-700 uppercase">
                  Th.10
                </span>
                <span className="text-lg font-bold">12</span>
              </div>
              <div>
                <h4 className="text-xs font-bold">
                  Hội nghị Thiết kế Thường niên
                </h4>
                <p className="text-[10px] text-slate-500">
                  Hội trường Chính • 09:00 AM
                </p>
              </div>
            </div>
          </RightSidebarWidget>

          <RightSidebarWidget title="Sinh nhật đồng nghiệp" icon={Cake}>
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
                  <p className="text-[10px] text-slate-500">Hôm nay</p>
                </div>
              </div>

              <button className="text-[10px] font-bold text-blue-700 hover:underline">
                Gửi lời chúc
              </button>
            </div>
          </RightSidebarWidget>
        </div>
      </div>
    </main>
  );
};

export default NewFeedPage;
