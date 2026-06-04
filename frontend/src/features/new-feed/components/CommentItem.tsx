import { useState } from "react";
import { Pencil, ThumbsUp, Trash2 } from "lucide-react";
import {
  CommentApi,
  type CommentReactionType,
} from "@/features/new-feed/api/comment.api";
import type { CommentItemType } from "@/features/new-feed/types/comment.type";
import CommentInput from "@/features/new-feed/components/CommentInput";
import { toast } from "sonner";
import type { ReactionType } from "../api/reaction.api";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { ANONYMOUS_MEMBER_NAME } from "@/features/group/utils/group-member";
import { formatTimeAgo } from "@/utils/formatTimeAgo";

const reactionOptions: {
  type: ReactionType;
  label: string;
  icon: string;
  className: string;
}[] = [
  {
    type: "LIKE",
    label: "Thích",
    icon: "/icons/like.png",
    className: "",
  },
  {
    type: "LOVE",
    label: "Yêu thích",
    icon: "/icons/love.png",
    className: "",
  },
  {
    type: "HAHA",
    label: "Haha",
    icon: "/icons/haha.png",
    className: "",
  },
  {
    type: "WOW",
    label: "Wow",
    icon: "/icons/wow.png",
    className: "",
  },
  {
    type: "SAD",
    label: "Buồn",
    icon: "/icons/sad.png",
    className: "",
  },
  {
    type: "ANGRY",
    label: "Phẫn nộ",
    icon: "/icons/angry.png",
    className: "",
  },
];

type CommentItemProps = {
  comment: CommentItemType;
  isReply?: boolean;
  allowAnonymousComment?: boolean;
  onDeleted: (commentId: number) => void;
  onUpdated: (commentId: number, content: string) => void;
  onReplyCreated?: (parentId: number, reply: CommentItemType) => void;
};

const CommentItem = ({
  comment,
  isReply = false,
  allowAnonymousComment = false,
  onDeleted,
  onUpdated,
  onReplyCreated,
}: CommentItemProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const [currentReaction, setCurrentReaction] =
    useState<CommentReactionType | null>(comment.currentReaction ?? null);

  const [reactionCount, setReactionCount] = useState(
    comment.reactionCount ?? 0,
  );

  const selectedReaction = reactionOptions.find(
    (item) => item.type === currentReaction,
  );

  const handleReact = async (reactionType: CommentReactionType) => {
    try {
      const res = await CommentApi.reactComment(comment.id, reactionType);
      const data = res.data;

      setCurrentReaction(data.currentReaction);
      setReactionCount(data.reactionCount);
    } catch (error: any) {
      console.error("React comment thất bại:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    try {
      await CommentApi.updateComment(comment.id, editContent.trim());
      onUpdated(comment.id, editContent.trim());
      setEditing(false);
    } catch (error: any) {
      console.error("Sửa comment thất bại:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await CommentApi.deleteComment(comment.id);
      onDeleted(comment.id);
    } catch (error: any) {
      console.error("Xóa comment thất bại:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const handleReply = async (content: string, isAnonymous?: boolean) => {
    try {
      const res = await CommentApi.replyComment(
        comment.id,
        content,
        isAnonymous,
      );
      const newReply = res.data;

      onReplyCreated?.(comment.id, newReply);
      setShowReplyInput(false);
    } catch (error: any) {
      console.error("Reply comment thất bại:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const displayName =
    comment.user.isAnonymous ||
    comment.isAnonymous ||
    comment.user.fullName === ANONYMOUS_MEMBER_NAME
      ? ANONYMOUS_MEMBER_NAME
      : comment.user.fullName;

  const avatarSrc =
    comment.user.isAnonymous || comment.isAnonymous
      ? getDefaultAvatarUrl(displayName)
      : comment.user.profile?.avatarUrl || getDefaultAvatarUrl(displayName);

  return (
    <div className={`flex gap-2 ${isReply ? "ml-10" : ""}`}>
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
        <img
          src={avatarSrc}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 flex">
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {displayName}
            </div>

            {editing ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-slate-100"
                />

                <button
                  type="button"
                  onClick={handleUpdate}
                  className="text-xs text-blue-700 font-semibold"
                >
                  Lưu
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="text-xs text-slate-500"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                {comment.content}
              </p>
            )}
          </div>

          <span className="text-xs text-slate-500">
            {comment.updatedAt
              ? formatTimeAgo(comment.updatedAt)
              : formatTimeAgo(comment.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 px-2 text-xs text-slate-500">
          <div className="relative group">
            <div className="absolute bottom-full left-0 hidden group-hover:block h-2 w-40" />

            <div className="absolute bottom-full left-0 mb-1 hidden w-max group-hover:flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg px-2 py-1 z-20">
              {reactionOptions.map((reaction) => {
                return (
                  <button
                    key={reaction.type}
                    type="button"
                    onClick={() => handleReact(reaction.type)}
                    className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-transform hover:scale-125 ${reaction.className}`}
                    title={reaction.label}
                  >
                    <img
                      src={reaction.icon}
                      alt={reaction.label}
                      className="w-6 h-6 shrink-0 object-contain"
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleReact(currentReaction ?? "LIKE")}
              className={`flex items-center gap-2 transition-colors disabled:opacity-60 ${
                selectedReaction
                  ? "text-slate-700 dark:text-slate-200"
                  : "text-slate-500 hover:text-blue-700"
              }`}
            >
              {selectedReaction ? (
                <img
                  src={selectedReaction.icon}
                  alt={selectedReaction.label}
                  className="w-6 h-6 object-contain shrink-0"
                />
              ) : (
                <ThumbsUp size={18} />
              )}

              <span className="text-xs font-semibold">{reactionCount}</span>
            </button>
          </div>

          {!isReply && (
            <button
              type="button"
              onClick={() => setShowReplyInput((prev) => !prev)}
              className="font-semibold hover:text-blue-700"
            >
              Trả lời
            </button>
          )}

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="hover:text-blue-700"
          >
            <Pencil size={13} />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {showReplyInput && !isReply && (
          <div className="mt-2">
            <CommentInput
              autoFocus
              placeholder="Viết phản hồi..."
              allowAnonymous={allowAnonymousComment}
              onSubmit={handleReply}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
