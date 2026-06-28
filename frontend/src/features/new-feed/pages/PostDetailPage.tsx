import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PostsApi } from "@/features/new-feed/api/post.api";
import PostCard from "@/features/new-feed/components/PostCard";
import { toast } from "sonner";
import type { Post } from "../types/post.type";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const PostDetailPage = () => {
  const { t } = useTranslation();
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
        console.error("Failed to fetch post:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("common.genericError");
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
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-96 text-red-500">
        {t("pages.posts.notFound")}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="md:hidden">
        <button
          onClick={handleGoBack}
          className="text-sm text-slate-500 hover:text-slate-700 pb-4 dark:hover:text-slate-300 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">{t("common.back")}</span>
        </button>
      </div>
      <PostCard
        {...post}
        showComment={true}
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
