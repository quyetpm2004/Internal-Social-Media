import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PostsApi } from "@/features/new-feed/api/new-feed.api";
import PostCard from "@/features/new-feed/components/PostCard";
import { toast } from "sonner";
import type { Post } from "../types/new-feed.type";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await PostsApi.getPostById(postId);
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
  }, [postId]);

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
    <div className="max-w-xl mx-auto py-8">
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
  );
};

export default PostDetailPage;
