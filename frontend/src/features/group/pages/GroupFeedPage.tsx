import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pin } from "lucide-react";
import type { ApiPost, Post } from "@/features/new-feed/types/new-feed.type";
import PostCreator from "@/features/new-feed/components/PostCreator";
import PostCard from "@/features/new-feed/components/PostCard";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { groupApi } from "@/features/group/apis/group.api";
import { useOutletContext, useParams } from "react-router-dom";
import AboutSidebar from "@/features/group/components/group-detail/main-detail/AboutSidebar";
import { toast } from "sonner";

const LIMIT = 10;

// Hàm mapper để convert dữ liệu API sang Props của PostCard
const mapApiPostToPostCard = (post: ApiPost): Post => {
  return {
    id: post.id,
    isPinned: post.isPinned,
    author: {
      name: post.user?.fullName || "Người dùng",
      avatar: post.user?.profile?.avatarUrl
        ? `${import.meta.env.VITE_BASE_URL_BACKEND}/uploads/avatar/${post.user?.profile?.avatarUrl}`
        : "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(post.user?.fullName || "User"),
    },
    role: "Thành viên",
    time: formatTimeAgo(post.createdAt),
    content: post.content,
    attachments:
      post.attachments?.map((attachment) => ({
        fileUrl: attachment.fileUrl,
        attachmentType: attachment.attachmentType,
        fileName: attachment.fileName,
      })) || [],
    stats: {
      likes: post._count?.reactions || 0,
      comments: post._count?.comments || 0,
    },
    currentReaction: post.reactions?.[0]?.reactionType || null,
  };
};

const GroupFeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const { groupId } = useParams();

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const { isMember, groupDetail } = useOutletContext<any>();

  // Refs để theo dõi state trong IntersectionObserver
  const hasMoreRef = useRef(hasMore);
  const initialLoadingRef = useRef(initialLoading);

  if (!groupId) {
    return (
      <div className="p-4 text-center text-sm text-slate-500 bg-white rounded-xl">
        Nhóm không tồn tại.
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

        // Lưu ý: Bạn có thể cần một hàm API riêng cho Group: PostsApi.getPostsByGroup(groupId, ...)
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
        console.error("Lỗi khi lấy bài viết group:", error);
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
    [groupId],
  );

  // Khởi tạo và Infinite Scroll
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

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-8">
      <div className="md:col-span-8 space-y-6">
        {/* 1. Tạo bài viết */}
        {isMember && <PostCreator fetchPosts={fetchPosts} />}
        {/* <PostCreator fetchPosts={fetchPosts} /> */}

        {/* 2. Trạng thái Loading ban đầu */}
        {initialLoading && (
          <div className="p-4 text-center text-sm text-slate-500 bg-white rounded-xl">
            Đang tải bài viết...
          </div>
        )}

        {/* 3. Bài viết đã Ghim (Pinned) */}
        {!initialLoading && pinnedPosts.length > 0 && (
          <div className="space-y-6">
            {pinnedPosts.map((post) => (
              <div
                key={`pinned-wrapper-${post.id}`}
                className="bg-blue-600 rounded-xl p-1 shadow-md"
              >
                <div className="flex items-center gap-1.5 px-3 py-1 text-white text-[10px] font-bold uppercase">
                  <Pin size={12} fill="currentColor" /> Pinned
                </div>
                <PostCard
                  {...post}
                  onDeleted={(id) =>
                    setPosts((prev) => prev.filter((p) => p.id !== id))
                  }
                />
              </div>
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
            />
          ))}
        </div>

        {/* 5. Trạng thái trống hoặc hết dữ liệu */}
        {!initialLoading && posts.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-dashed">
            Chưa có thảo luận nào trong nhóm này.
          </div>
        )}

        {loading && !initialLoading && (
          <div className="text-center text-xs text-slate-400 py-4">
            Đang tải thêm...
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center text-xs text-slate-400 py-4">
            Bạn đã xem hết tất cả bài viết.
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
