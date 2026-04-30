import { useState } from "react";
import {
  Angry,
  Frown,
  Heart,
  Laugh,
  MessageSquare,
  Pin,
  Share2,
  SmilePlus,
  ThumbsUp,
} from "lucide-react";
import type { PostCardProps } from "../types/new-feed.type";
import { ReactionApi, type ReactionType } from "../api/reaction.api";
import CommentSection from "./CommentSection";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PostsApi } from "../api/new-feed.api";

const reactionOptions: {
  type: ReactionType;
  label: string;
  icon: React.ElementType;
  className: string;
}[] = [
  {
    type: "LIKE",
    label: "Thích",
    icon: ThumbsUp,
    className: "text-blue-600",
  },
  {
    type: "LOVE",
    label: "Yêu thích",
    icon: Heart,
    className: "text-red-500",
  },
  {
    type: "HAHA",
    label: "Haha",
    icon: Laugh,
    className: "text-yellow-500",
  },
  {
    type: "WOW",
    label: "Wow",
    icon: SmilePlus,
    className: "text-yellow-500",
  },
  {
    type: "SAD",
    label: "Buồn",
    icon: Frown,
    className: "text-yellow-600",
  },
  {
    type: "ANGRY",
    label: "Phẫn nộ",
    icon: Angry,
    className: "text-orange-600",
  },
];

const PostCard: React.FC<PostCardProps> = ({
  id: postId,
  author,
  role,
  time,
  content,
  image,
  isPinned = false,
  stats,
  currentReaction: initialReaction = null,
  onDeleted,
  onUpdated,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [reactionCount, setReactionCount] = useState(stats.likes);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    initialReaction,
  );
  const [showReactions, setShowReactions] = useState(false);
  const [loadingReaction, setLoadingReaction] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const selectedReaction = reactionOptions.find(
    (item) => item.type === currentReaction,
  );

  const handleReactPost = async (reactionType: ReactionType) => {
    if (loadingReaction) return;

    try {
      setLoadingReaction(true);

      const res = await ReactionApi.reactToPost(postId, reactionType);

      const data = res.data;

      setCurrentReaction(data.currentReaction);
      setReactionCount(data.reactionCount);
      setShowReactions(false);
    } catch (error) {
      console.error("Thả cảm xúc thất bại:", error);
    } finally {
      setLoadingReaction(false);
    }
  };

  const ReactionIcon = selectedReaction?.icon ?? ThumbsUp;

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;

    try {
      await PostsApi.updatePost(postId, editContent.trim());
      onUpdated?.(postId, editContent.trim());
      setEditingPost(false);
    } catch (error) {
      console.error("Sửa bài viết thất bại:", error);
    }
  };

  const handleDeletePost = async () => {
    const ok = window.confirm("Bạn có chắc muốn xóa bài viết này không?");
    if (!ok) return;

    try {
      await PostsApi.deletePost(postId);
      onDeleted?.(postId);
    } catch (error) {
      console.error("Xóa bài viết thất bại:", error);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden relative ${
        isPinned ? "ring-1 ring-blue-500/20" : ""
      }`}
    >
      {isPinned && (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
          <Pin size={12} className="text-blue-700 fill-current" />
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tighter">
            Bài ghim
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
            <img src={author.avatar} alt={author.name} />
          </div>

          <div>
            <h3 className="text-sm font-bold">{author.name}</h3>
            <p className="text-[11px] text-slate-500">
              {role} • {time}
            </p>
          </div>

          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2 rounded-lg"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Pencil size={14} />
                  Sửa bài viết
                </button>

                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} />
                  Xóa bài viết
                </button>
              </div>
            )}
          </div>
        </div>

        {editingPost ? (
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm outline-none text-slate-900 dark:text-slate-100"
            />

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPost(false);
                  setEditContent(content);
                }}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleUpdatePost}
                className="px-3 py-1.5 rounded-lg text-sm bg-blue-700 text-white font-semibold hover:bg-blue-800"
              >
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm mb-4">
            {content}
          </p>
        )}

        {image && (
          <div className="rounded-lg overflow-hidden mb-4 bg-slate-100 aspect-video">
            <img
              src={`${import.meta.env.VITE_BASE_URL_BACKEND}/uploads/post/${image}`}
              className="w-full h-full object-cover"
              alt="Post content"
            />
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="relative group">
            <div className="absolute bottom-full left-0 hidden group-hover:block h-3 w-52" />

            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg px-3 py-2 z-20">
              {reactionOptions.map((reaction) => {
                const Icon = reaction.icon;

                return (
                  <button
                    key={reaction.type}
                    type="button"
                    disabled={loadingReaction}
                    onClick={() => handleReactPost(reaction.type)}
                    className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-transform hover:scale-125 ${reaction.className}`}
                    title={reaction.label}
                  >
                    <Icon size={22} />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={loadingReaction}
              onClick={() => handleReactPost(currentReaction ?? "LIKE")}
              className={`flex items-center gap-2 transition-colors disabled:opacity-60 ${
                selectedReaction
                  ? selectedReaction.className
                  : "text-slate-500 hover:text-blue-700"
              }`}
            >
              <ReactionIcon size={18} />
              <span className="text-xs font-semibold">{reactionCount}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowComments((prev) => !prev)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-700 transition-colors"
          >
            <MessageSquare size={18} />
            <span className="text-xs font-semibold">{stats.comments}</span>
          </button>

          <button className="flex items-center gap-2 text-slate-500 hover:text-blue-700 transition-colors ml-auto">
            <Share2 size={18} />
            <span className="text-xs font-semibold">Chia sẻ</span>
          </button>
        </div>
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <CommentSection postId={postId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
