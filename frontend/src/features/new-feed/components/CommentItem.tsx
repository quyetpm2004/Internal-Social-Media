import { useState } from "react";
import {
  Angry,
  Frown,
  Heart,
  Laugh,
  Pencil,
  SmilePlus,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import {
  CommentApi,
  type CommentReactionType,
} from "@/features/new-feed/api/comment.api";
import type { CommentItemType } from "@/features/new-feed/types/comment.type";
import CommentInput from "@/features/new-feed/components/CommentInput";

const reactions: {
  type: CommentReactionType;
  label: string;
  icon: React.ElementType;
  className: string;
}[] = [
  { type: "LIKE", label: "Thích", icon: ThumbsUp, className: "text-blue-600" },
  { type: "LOVE", label: "Yêu thích", icon: Heart, className: "text-red-500" },
  { type: "HAHA", label: "Haha", icon: Laugh, className: "text-yellow-500" },
  { type: "WOW", label: "Wow", icon: SmilePlus, className: "text-yellow-500" },
  { type: "SAD", label: "Buồn", icon: Frown, className: "text-yellow-600" },
  {
    type: "ANGRY",
    label: "Phẫn nộ",
    icon: Angry,
    className: "text-orange-600",
  },
];

type CommentItemProps = {
  comment: CommentItemType;
  isReply?: boolean;
  onDeleted: (commentId: number) => void;
  onUpdated: (commentId: number, content: string) => void;
  onReplyCreated?: (parentId: number, reply: CommentItemType) => void;
};

const CommentItem = ({
  comment,
  isReply = false,
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

  const selectedReaction = reactions.find(
    (item) => item.type === currentReaction,
  );

  const ReactionIcon = selectedReaction?.icon ?? ThumbsUp;

  const handleReact = async (reactionType: CommentReactionType) => {
    try {
      const res = await CommentApi.reactComment(comment.id, reactionType);
      const data = res.data;

      setCurrentReaction(data.currentReaction);
      setReactionCount(data.reactionCount);
    } catch (error) {
      console.error("React comment thất bại:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    try {
      await CommentApi.updateComment(comment.id, editContent.trim());
      onUpdated(comment.id, editContent.trim());
      setEditing(false);
    } catch (error) {
      console.error("Sửa comment thất bại:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await CommentApi.deleteComment(comment.id);
      onDeleted(comment.id);
    } catch (error) {
      console.error("Xóa comment thất bại:", error);
    }
  };

  const handleReply = async (content: string) => {
    try {
      const res = await CommentApi.replyComment(comment.id, content);
      const newReply = res.data;

      onReplyCreated?.(comment.id, newReply);
      setShowReplyInput(false);
    } catch (error) {
      console.error("Reply comment thất bại:", error);
    }
  };

  const avatarSrc =
    comment.user.profile.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.fullName)}`;

  return (
    <div className={`flex gap-2 ${isReply ? "ml-10" : ""}`}>
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
        <img
          src={avatarSrc}
          alt={comment.user.fullName}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {comment.user.fullName}
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

        <div className="flex items-center gap-3 mt-1 px-2 text-xs text-slate-500">
          <div className="relative group">
            <div className="absolute bottom-full left-0 hidden group-hover:block h-2 w-40" />

            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg px-2 py-1 z-20">
              {reactions.map((reaction) => {
                const Icon = reaction.icon;

                return (
                  <button
                    key={reaction.type}
                    type="button"
                    onClick={() => handleReact(reaction.type)}
                    className={`p-1 rounded-full hover:scale-125 transition-transform ${reaction.className}`}
                    title={reaction.label}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleReact(currentReaction ?? "LIKE")}
              className={`font-semibold ${
                selectedReaction ? selectedReaction.className : ""
              }`}
            >
              <ReactionIcon size={13} className="inline mr-1" />
              {reactionCount}
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
              onSubmit={handleReply}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
