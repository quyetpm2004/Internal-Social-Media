import { useOutletContext, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PostCard from "@/features/new-feed/components/PostCard";
import { toast } from "sonner";
import type { Post } from "@/features/new-feed/types/post.type";
import { mapApiPostToPostCard } from "@/utils/formatTimeAgo";
import { groupApi } from "@/features/group/apis/group.api";
import AboutSidebar from "@/features/group/components/group-detail/main-detail/AboutSidebar";
import type { GroupDetail } from "@/features/group/types/group.type";
import { useTranslation } from "react-i18next";
import { mapGroupMembersToMentionCandidates } from "@/features/mention/utils/mention";
import { useAuthStore } from "@/features/auth/store/auth.store";

const PostDetailInGroupPage = () => {
  const { t } = useTranslation();
  const { groupId, postId } = useParams<{ groupId: string; postId: string }>();
  const [post, setPost] = useState<Post>();
  const [loading, setLoading] = useState(true);
  const { groupDetail } = useOutletContext<{
    isMember: boolean;
    groupDetail: GroupDetail | null;
  }>();
  const currentUser = useAuthStore((state) => state.user);
  const mentionCandidates = useMemo(
    () =>
      groupDetail?.members
        ? mapGroupMembersToMentionCandidates(groupDetail.members)
        : undefined,
    [groupDetail?.members],
  );

  useEffect(() => {
    if (!groupId || !postId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await groupApi.getGroupPostDetail(groupId, postId);
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
  }, [groupId, postId]);

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
    <div className="flex flex-col md:grid md:grid-cols-12 gap-8">
      <div className="md:col-span-8 space-y-6">
        <PostCard
          {...post}
          allowAnonymousComment={groupDetail?.allowAnonymousJoin ?? false}
          mentionCandidates={mentionCandidates}
          excludeMentionUserId={currentUser?.id}
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
