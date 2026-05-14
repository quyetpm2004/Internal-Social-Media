import { useState } from "react";
import {
  Download,
  FileText,
  MessageSquare,
  Pin,
  Share2,
  ThumbsUp,
} from "lucide-react";
import type { PostCardProps } from "@/features/new-feed/types/new-feed.type";
import {
  ReactionApi,
  type ReactionType,
} from "@/features/new-feed/api/reaction.api";
import CommentSection from "@/features/new-feed/components/CommentSection";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PostsApi } from "@/features/new-feed/api/new-feed.api";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

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

const PostCard: React.FC<PostCardProps> = ({
  id: postId,
  author,
  role,
  time,
  content,
  attachments = [],
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
  const [loadingReaction, setLoadingReaction] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const selectedReactionData = reactionOptions.find(
    (item) => item.type === currentReaction,
  );

  const imageAttachments = attachments.filter(
    (item) => item.attachmentType === "IMAGE",
  );

  const videoAttachments = attachments.filter(
    (item) => item.attachmentType === "VIDEO",
  );

  const fileAttachments = attachments.filter(
    (item) => item.attachmentType === "FILE",
  );

  const [index, setIndex] = useState(-1);

  const handleReactPost = async (reactionType: ReactionType) => {
    if (loadingReaction) return;

    try {
      setLoadingReaction(true);

      const res = await ReactionApi.reactToPost(postId, reactionType);

      const data = res.data;

      setCurrentReaction(data.currentReaction);
      setReactionCount(data.reactionCount);
    } catch (error) {
      console.error("Thả cảm xúc thất bại:", error);
    } finally {
      setLoadingReaction(false);
    }
  };

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

        {imageAttachments.length > 0 && (
          <div
            className={`grid gap-1 rounded-xl overflow-hidden mb-4 ${
              imageAttachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {imageAttachments.slice(0, 4).map((item, index) => (
              <div
                key={index}
                className={`relative bg-slate-100 overflow-hidden ${
                  imageAttachments.length === 3 && index === 0
                    ? "row-span-2"
                    : ""
                } ${
                  imageAttachments.length === 1
                    ? "aspect-auto"
                    : "aspect-square"
                }`}
                onClick={() => setIndex(index)}
              >
                <img
                  src={item.fileUrl}
                  className="w-full h-full object-cover hover:brightness-90 transition-all cursor-pointer"
                  alt={`Post content ${index + 1}`}
                />

                {imageAttachments.length > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl font-bold">
                      +{imageAttachments.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {videoAttachments.length > 0 && (
          <div className="space-y-3 mb-4">
            {videoAttachments.map((video, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
              >
                <video controls className="w-full max-h-[500px] bg-black">
                  <source src={video.fileUrl} />
                  Trình duyệt không hỗ trợ video.
                </video>
              </div>
            ))}
          </div>
        )}

        {fileAttachments.length > 0 && (
          <div className="space-y-2 mb-4">
            {fileAttachments.map((file, index) => (
              <a
                key={index}
                href={file.fileUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="text-slate-500 shrink-0" />

                  <span className="text-sm truncate">
                    {file.fileName || "Tệp đính kèm"}
                  </span>
                </div>

                <Download size={18} className="text-slate-500 shrink-0" />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="relative group">
            <div className="absolute bottom-full left-0 hidden group-hover:block h-3 w-52" />

            <div className="absolute bottom-full left-0 mb-2 group-hover:flex w-max gap-2 bg-white hidden dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg px-3 py-2 z-20">
              {reactionOptions.map((reaction) => {
                return (
                  <button
                    key={reaction.type}
                    type="button"
                    disabled={loadingReaction}
                    onClick={() => handleReactPost(reaction.type)}
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
              disabled={loadingReaction}
              onClick={() => handleReactPost(currentReaction ?? "LIKE")}
              className={`flex items-center gap-2 transition-colors disabled:opacity-60 ${
                selectedReactionData
                  ? "text-slate-700 dark:text-slate-200"
                  : "text-slate-500 hover:text-blue-700"
              }`}
            >
              {selectedReactionData ? (
                <img
                  src={selectedReactionData.icon}
                  alt={selectedReactionData.label}
                  className="w-6 h-6 object-contain shrink-0"
                />
              ) : (
                <ThumbsUp size={18} />
              )}

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
      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={imageAttachments.map((item) => ({ src: item.fileUrl }))}
      />
    </div>
  );
};

export default PostCard;
