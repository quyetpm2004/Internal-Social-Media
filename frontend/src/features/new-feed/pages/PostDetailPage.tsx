import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PostsApi } from "@/features/new-feed/api/new-feed.api";
import PostCard from "@/features/new-feed/components/PostCard";
import { toast } from "sonner";
import type { Post } from "../types/new-feed.type";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { ArrowLeft } from "lucide-react";

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post>();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    <div className="max-w-3xl mx-auto py-8">
      <div>
        <button
          onClick={handleGoBack}
          className="text-sm text-slate-500 hover:text-slate-700 pb-4 dark:hover:text-slate-300 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Quay lại</span>
        </button>
      </div>
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
