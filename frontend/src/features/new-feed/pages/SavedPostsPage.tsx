import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PostCard from "@/features/new-feed/components/PostCard";
import { PostsApi } from "@/features/new-feed/api/post.api";
import type { Post } from "@/features/new-feed/types/post.type";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bookmark, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LIMIT = 10;

const SavedPostsPage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const navigate = useNavigate();
  const fetchSavedPosts = useCallback(
    async (currentPage: number) => {
      if (isFetchingRef.current) return;
      if (!hasMore && currentPage > 1) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);
        const res = await PostsApi.getSavedPosts(currentPage, LIMIT);
        const mapped = (res.data.posts || []).map(mapApiPostToPostCard);

        if (currentPage === 1) {
          setPosts(mapped);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            return [
              ...prev,
              ...mapped.filter((item) => !existingIds.has(item.id)),
            ];
          });
        }
        setHasMore(Boolean(res.data.hasMore));
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("pages.savedPosts.loadFailed");
        toast.error(message);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [hasMore],
  );

  useEffect(() => {
    fetchSavedPosts(1);
  }, [fetchSavedPosts]);

  useEffect(() => {
    if (page === 1) return;
    fetchSavedPosts(page);
  }, [page, fetchSavedPosts]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !isFetchingRef.current &&
          hasMore &&
          !initialLoading
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, initialLoading]);

  const handleCopyPostLink = (postId: number) => {
    const postLink = `${import.meta.env.VITE_BASE_URL_FRONTEND}/news-feed/${postId}`;
    navigator.clipboard.writeText(postLink);
    toast.success(t("pages.posts.copyLinkSuccess"));
  };

  return (
    <main className="mx-auto max-w-3xl flex-1 px-3 py-6 sm:px-5 md:py-8">
      <div className="md:hidden">
        <button
          onClick={() => navigate("/")}
          className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">{t("common.back")}</span>
        </button>
      </div>
      <div className="space-y-4">
        <header className="px-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t("pages.savedPosts.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("pages.savedPosts.description")}
          </p>
        </header>

        {initialLoading && (
          <>
            <p className="sr-only">{t("pages.savedPosts.loading")}</p>
            <div
              className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              aria-hidden
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
              </div>
            </div>
          </>
        )}

        {!initialLoading && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40">
              <Bookmark size={22} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("pages.savedPosts.empty")}
            </p>
          </div>
        )}

        <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            {...post}
            onDeleted={(postId) =>
              setPosts((prev) => prev.filter((item) => item.id !== postId))
            }
            onUpdated={(postId, newContent, newFormat) =>
              setPosts((prev) =>
                prev.map((item) =>
                  item.id === postId
                    ? { ...item, content: newContent, contentFormat: newFormat }
                    : item,
                ),
              )
            }
            onSavedChanged={(postId, isSaved) => {
              if (!isSaved) {
                setPosts((prev) => prev.filter((item) => item.id !== postId));
              } else {
                setPosts((prev) =>
                  prev.map((item) =>
                    item.id === postId ? { ...item, isSaved: true } : item,
                  ),
                );
              }
            }}
            onCopied={handleCopyPostLink}
          />
        ))}
        </div>

        {loading && !initialLoading && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("pages.savedPosts.loadingMore")}
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="flex items-center gap-3 py-2 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            {t("pages.savedPosts.noMore")}
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        <div ref={loadMoreRef} className="h-8" />
      </div>
    </main>
  );
};

export default SavedPostsPage;
