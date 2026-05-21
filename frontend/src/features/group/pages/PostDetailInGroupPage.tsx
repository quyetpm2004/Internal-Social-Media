import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PostCard from "@/features/new-feed/components/PostCard";
import { toast } from "sonner";
import type { Post } from "@/features/new-feed/types/new-feed.type";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { groupApi } from "@/features/group/apis/group.api";
import AboutSidebar from "@/features/group/components/group-detail/main-detail/AboutSidebar";
import type { GroupDetail } from "@/features/group/types/group.type";

const PostDetailInGroupPage = () => {
  const { groupId, postId } = useParams<{ groupId: string; postId: string }>();
  const [post, setPost] = useState<Post>();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { groupDetail } = useOutletContext<{
    isMember: boolean;
    groupDetail: GroupDetail | null;
  }>();

  useEffect(() => {
    if (!groupId || !postId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await groupApi.getGroupPostDetail(groupId, postId);
        const mappedPost = mapApiPostToPostCard(res.data);
        setPost(mappedPost);
      } catch (error: any) {
        console.error("Lỗi khi lấy bài viết:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Có lỗi xảy ra. Vui lòng thử lại.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, postId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-96 text-red-500">
        Không tìm thấy bài viết.
      </div>
    );
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-8">
      <div className="md:col-span-8 space-y-6">
        <PostCard
          {...post}
          onUpdated={(postId, newContent, newFormat) => {
            setPost((prev) =>
              prev && prev.id === postId
                ? { ...prev, content: newContent, contentFormat: newFormat }
                : prev,
            );
          }}
        />
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

export default PostDetailInGroupPage;
