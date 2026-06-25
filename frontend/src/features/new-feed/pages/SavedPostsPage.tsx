import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PostCard from "@/features/new-feed/components/PostCard";
import { PostsApi } from "@/features/new-feed/api/post.api";
import type { Post } from "@/features/new-feed/types/post.type";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { useTranslation } from "react-i18next";

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
    <main className="flex-1 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
            {t("pages.savedPosts.title")}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {t("pages.savedPosts.description")}
          </p>
        </div>

        {initialLoading && (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
            {t("pages.savedPosts.loading")}
          </div>
        )}

        {!initialLoading && posts.length === 0 && (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
            {t("pages.savedPosts.empty")}
          </div>
        )}

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

        {loading && !initialLoading && (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
            {t("pages.savedPosts.loadingMore")}
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center text-sm text-slate-500 py-2">
            {t("pages.savedPosts.noMore")}
          </div>
        )}

        <div ref={loadMoreRef} className="h-8" />
      </div>
    </main>
  );
};

export default SavedPostsPage;
