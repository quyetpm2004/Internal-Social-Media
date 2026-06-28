import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Post } from "@/features/new-feed/types/post.type";
import PostCreator from "@/features/new-feed/components/PostCreator";
import PostCard from "@/features/new-feed/components/PostCard";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { groupApi } from "@/features/group/apis/group.api";
import { useOutletContext, useParams } from "react-router-dom";
import AboutSidebar from "@/features/group/components/group-detail/main-detail/AboutSidebar";
import { toast } from "sonner";
import type { GroupDetail } from "@/features/group/types/group.type";
import type { GroupOutletContext } from "../types/group-outlet.type";
import { PostsApi } from "@/features/new-feed/api/post.api";
import { useTranslation } from "react-i18next";
import { mapGroupMembersToMentionCandidates } from "@/features/mention/utils/mention";
import { useAuthStore } from "@/features/auth/store/auth.store";

const LIMIT = 10;

const GroupFeedPage: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const { groupId } = useParams();
  const outletContext = useOutletContext<GroupOutletContext>();
  const { canManageMembers } = outletContext;
  const numericGroupId = Number(groupId);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const { isMember, groupDetail } = useOutletContext<{
    isMember: boolean;
    groupDetail: GroupDetail | null;
  }>();

  const allowAnonymous = groupDetail?.allowAnonymousJoin ?? false;
  const currentUser = useAuthStore((state) => state.user);
  const mentionCandidates = useMemo(
    () =>
      groupDetail?.members
        ? mapGroupMembersToMentionCandidates(groupDetail.members)
        : undefined,
    [groupDetail?.members],
  );

  // Refs để theo dõi state trong IntersectionObserver
  const hasMoreRef = useRef(hasMore);
  const initialLoadingRef = useRef(initialLoading);

  if (!groupId) {
    return (
      <div className="p-4 text-center text-sm text-slate-500 bg-white rounded-xl">
        {t("pages.groups.notFound")}
      </div>
    );
  }

  useEffect(() => {
    hasMoreRef.current = hasMore;
    initialLoadingRef.current = initialLoading;
  }, [hasMore, initialLoading]);

  // Logic lấy dữ liệu
  const fetchPosts = useCallback(
    async (currentPage: number) => {
      if (isFetchingRef.current) return;
      if (!hasMoreRef.current && currentPage > 1) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);

        const response = await groupApi.getPost(groupId, currentPage, LIMIT);

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
        console.error("Failed to fetch group posts:", error);
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
    [groupId],
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetchingRef.current &&
          hasMoreRef.current &&
          !initialLoadingRef.current
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (page > 1) fetchPosts(page);
  }, [page, fetchPosts]);

  const handleCopyGroupLink = (postId: number) => {
    if (!groupId) return;
    const postLink = `${import.meta.env.VITE_BASE_URL_FRONTEND}/groups/${groupId}/posts/${postId}`;
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

      if (willPin) {
        fetchPosts(1);
        toast.success(t("pages.posts.pinSuccess"));
      } else {
        fetchPosts(1);
        toast.success(t("pages.posts.unpinSuccess"));
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-8 md:px-4">
      <div className="md:col-span-8 space-y-6">
        {/* 1. Tạo bài viết */}
        {isMember && (
          <PostCreator
            fetchPosts={fetchPosts}
            groupVisibility="GROUP"
            allowAnonymousPost={allowAnonymous}
            mentionCandidates={mentionCandidates}
            excludeMentionUserId={currentUser?.id}
          />
        )}

        {/* 2. Trạng thái Loading ban đầu */}
        {initialLoading && (
          <div className="p-4 text-center text-sm text-slate-500 bg-white rounded-xl">
            {t("pages.groups.loadingPosts")}
          </div>
        )}

        {/* 3. Bài viết đã Ghim (Pinned) */}
        {!initialLoading && pinnedPosts.length > 0 && (
          <div className="space-y-6">
            {pinnedPosts.map((post) => (
              <PostCard
                key={`pinned-${post.id}`}
                {...post}
                onDeleted={(id) => {
                  setPosts((prev) => prev.filter((p) => p.id !== id));
                  setPinnedPosts((prev) => prev.filter((p) => p.id !== id));
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
                onCopied={(postId) => handleCopyGroupLink(postId)}
                canPinPost={canManageMembers}
                pinGroupId={numericGroupId}
                onPinned={handlePinPost}
                allowAnonymousComment={allowAnonymous}
                mentionCandidates={mentionCandidates}
                excludeMentionUserId={currentUser?.id}
              />
            ))}
          </div>
        )}

        {/* 4. Danh sách bài viết chính */}
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
              onCopied={(postId) => handleCopyGroupLink(postId)}
              canPinPost={canManageMembers}
              pinGroupId={numericGroupId}
              onPinned={handlePinPost}
              allowAnonymousComment={allowAnonymous}
              mentionCandidates={mentionCandidates}
              excludeMentionUserId={currentUser?.id}
            />
          ))}
        </div>

        {/* 5. Trạng thái trống hoặc hết dữ liệu */}
        {!initialLoading && posts.length === 0 && pinnedPosts.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-dashed">
            {t("pages.groups.emptyDiscussion")}
          </div>
        )}

        {loading && !initialLoading && (
          <div className="text-center text-xs text-slate-400 py-4">
            {t("pages.groups.loadingMore")}
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center text-xs text-slate-400 py-4">
            {t("pages.groups.noMorePosts")}
          </div>
        )}

        {/* Observer Target */}
        <div ref={loadMoreRef} className="h-4" />
      </div>

      <AboutSidebar
        description={groupDetail?.description}
        establishedDate={
          groupDetail?.createdAt
            ? new Date(groupDetail.createdAt).toLocaleDateString()
            : ""
        }
        department={groupDetail?.department?.name}
      />
    </div>
  );
};

export default GroupFeedPage;
