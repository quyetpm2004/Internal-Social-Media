import { useEffect, useRef, useState } from "react";
import { CommentApi } from "@/features/new-feed/api/comment.api";
import type { CommentItemType } from "@/features/new-feed/types/comment.type";
import CommentInput from "@/features/new-feed/components/CommentInput";
import CommentItem from "@/features/new-feed/components/CommentItem";
import type { MentionUser } from "@/features/mention/utils/mention";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type CommentSectionProps = {
  postId: number;
  canPinComment?: boolean;
  allowAnonymousComment?: boolean;
  mentionCandidates?: MentionUser[];
  excludeMentionUserId?: number;
};

const sortComments = (items: CommentItemType[]) =>
  [...items].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

const CommentSection = ({
  postId,
  canPinComment = false,
  allowAnonymousComment = false,
  mentionCandidates,
  excludeMentionUserId,
}: CommentSectionProps) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [repliesMap, setRepliesMap] = useState<
    Record<number, CommentItemType[]>
  >({});
  const [replyPageMap, setReplyPageMap] = useState<Record<number, number>>({});
  const [replyHasMoreMap, setReplyHasMoreMap] = useState<
    Record<number, boolean>
  >({});

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const loadComments = async (nextPage = 1) => {
    if (loading) return;

    try {
      setLoading(true);

      const res = await CommentApi.getComments(postId, nextPage, 10);
      const payload = res.data;

      const data = payload.comments ?? [];
      const hasMoreValue = payload.hasMore ?? false;

      setComments((prev) => {
        if (nextPage === 1) return sortComments(data);
        return sortComments([...prev, ...data]);
      });

      setPage(payload.page ?? nextPage);
      setHasMore(hasMoreValue);
    } catch (error: any) {
      console.error("Load comments failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (
    content: string,
    isAnonymous?: boolean,
    mentionedUserIds?: number[],
    mentionAll?: boolean,
  ) => {
    try {
      setCreating(true);

      const res = await CommentApi.createComment(
        postId,
        content,
        isAnonymous,
        mentionedUserIds,
        mentionAll,
      );
      const newComment = res.data;

      setComments((prev) => [newComment, ...prev]);
    } catch (error: any) {
      console.error("Create comment failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const loadReplies = async (commentId: number, nextPage = 1) => {
    try {
      const res = await CommentApi.getReplies(commentId, nextPage, 10);
      const payload = res.data;

      const data = payload.replies ?? [];
      const hasMoreValue = payload.hasMore ?? false;

      setRepliesMap((prev) => ({
        ...prev,
        [commentId]:
          nextPage === 1 ? data : [...(prev[commentId] ?? []), ...data],
      }));

      setReplyPageMap((prev) => ({
        ...prev,
        [commentId]: payload.page ?? nextPage,
      }));

      setReplyHasMoreMap((prev) => ({
        ...prev,
        [commentId]: hasMoreValue,
      }));
    } catch (error: any) {
      console.error("Load replies failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    }
  };

  const handleDeleted = (commentId: number) => {
    setComments((prev) => prev.filter((item) => item.id !== commentId));

    setRepliesMap((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((parentId) => {
        next[Number(parentId)] = next[Number(parentId)].filter(
          (reply) => reply.id !== commentId,
        );
      });

      return next;
    });
  };

  const handleUpdated = (commentId: number, content: string) => {
    setComments((prev) =>
      prev.map((item) => (item.id === commentId ? { ...item, content } : item)),
    );

    setRepliesMap((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((parentId) => {
        next[Number(parentId)] = next[Number(parentId)].map((reply) =>
          reply.id === commentId ? { ...reply, content } : reply,
        );
      });

      return next;
    });
  };

  const handlePinned = (commentId: number, isPinned: boolean) => {
    setComments((prev) =>
      sortComments(
        prev.map((item) => {
          if (item.id === commentId) {
            return { ...item, isPinned };
          }

          if (isPinned) {
            return { ...item, isPinned: false };
          }

          return item;
        }),
      ),
    );
  };

  const handleReplyCreated = (parentId: number, reply: CommentItemType) => {
    setRepliesMap((prev) => ({
      ...prev,
      [parentId]: [reply, ...(prev[parentId] ?? [])],
    }));

    setComments((prev) =>
      prev.map((item) =>
        item.id === parentId
          ? {
              ...item,
              replyCount: item.replyCount + 1,
            }
          : item,
      ),
    );
  };

  useEffect(() => {
    setComments([]);
    setRepliesMap({});
    setReplyPageMap({});
    setReplyHasMoreMap({});
    setPage(1);
    setHasMore(true);

    loadComments(1);
  }, [postId]);

  return (
    <div className="space-y-4">
      <CommentInput
        loading={creating}
        placeholder={t("pages.posts.writeComment")}
        allowAnonymous={allowAnonymousComment}
        mentionCandidates={mentionCandidates}
        excludeMentionUserId={excludeMentionUserId}
        onSubmit={handleCreateComment}
      />

      <div className="space-y-4">
        {comments.map((comment) => {
          const replies = repliesMap[comment.id] ?? [];
          const replyCount = comment.replyCount ?? 0;
          const replyPage = replyPageMap[comment.id] ?? 0;
          const replyHasMore = replyHasMoreMap[comment.id] ?? false;

          return (
            <div key={comment.id} className="space-y-2">
              <CommentItem
                comment={comment}
                allowAnonymousComment={allowAnonymousComment}
                canPinComment={canPinComment}
                mentionCandidates={mentionCandidates}
                excludeMentionUserId={excludeMentionUserId}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
                onPinned={handlePinned}
                onReplyCreated={handleReplyCreated}
              />

              {replyCount > 0 && replies.length === 0 && (
                <button
                  type="button"
                  onClick={() => loadReplies(comment.id, 1)}
                  className="ml-10 text-xs font-semibold text-slate-500 hover:text-blue-700"
                >
                  {t("pages.posts.viewReplies", { count: replyCount })}
                </button>
              )}

              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  allowAnonymousComment={allowAnonymousComment}
                  mentionCandidates={mentionCandidates}
                  excludeMentionUserId={excludeMentionUserId}
                  onDeleted={handleDeleted}
                  onUpdated={handleUpdated}
                />
              ))}

              {replies.length > 0 && replyHasMore && (
                <button
                  type="button"
                  onClick={() => loadReplies(comment.id, replyPage + 1)}
                  className="ml-10 text-xs font-semibold text-slate-500 hover:text-blue-700"
                >
                  {t("pages.posts.viewMoreReplies")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center text-xs text-slate-500">
          {t("pages.posts.loadingComments")}
        </div>
      )}

      <div ref={observerRef} />

      {!loading && comments.length === 0 && (
        <div className="text-center text-sm text-slate-500">
          {t("pages.posts.noComments")}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
