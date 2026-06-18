import { useEffect, useState } from "react";
import {
  Bookmark,
  Download,
  EllipsisVertical,
  FileText,
  MessageSquare,
  Pin,
  Share2,
  ThumbsUp,
} from "lucide-react";
import type { PostCardProps } from "@/features/new-feed/types/post.type";
import {
  ReactionApi,
  type ReactionType,
} from "@/features/new-feed/api/reaction.api";
import CommentSection from "@/features/new-feed/components/CommentSection";
import RichTextContent from "@/features/new-feed/components/RichTextContent";
import RichTextEditor from "@/features/new-feed/components/RichTextEditor";
import {
  isRichTextEmpty,
  sanitizePostHtml,
} from "@/features/new-feed/utils/rich-text";
import { Pencil, Trash2 } from "lucide-react";
import { PostsApi } from "@/features/new-feed/api/post.api";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import ConfirmModal from "@/components/common/ConfirmModal";
import PollCard from "@/components/poll/PollCard";
import EventCard from "@/components/event/EventCard";
import { Link } from "react-router-dom";
import type { PollSummary } from "@/types/poll.type";
import type { EventSummary } from "@/types/event.type";
import { useTranslation } from "react-i18next";

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
  contentFormat,
  attachments = [],
  isPinned = false,
  stats,
  currentReaction: initialReaction = null,
  isSaved: initialIsSaved = false,
  onDeleted,
  onUpdated,
  onCopied,
  canPinPost,
  pinGroupId = null,
  onPinned,
  onSavedChanged,
  allowAnonymousComment = false,
  showComment = false,
  poll: initialPoll = null,
  event: initialEvent = null,
}) => {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(showComment);
  const [poll, setPoll] = useState<PollSummary | null>(initialPoll);
  const [event, setEvent] = useState<EventSummary | null>(initialEvent);
  const [reactionCount, setReactionCount] = useState(stats.likes);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    initialReaction,
  );
  const [loadingReaction, setLoadingReaction] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [displayContent, setDisplayContent] = useState(content);
  const [displayFormat, setDisplayFormat] = useState(contentFormat);
  const user = useAuthStore((state) => state.user);
  const [openConfirmPinPost, setOpenConfirmPinPost] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(initialIsSaved));
  const [savingPost, setSavingPost] = useState(false);

  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);
  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);
  useEffect(() => {
    setIsSaved(Boolean(initialIsSaved));
  }, [initialIsSaved]);

  useEffect(() => {
    if (!editingPost) {
      setEditContent(content);
      setDisplayContent(content);
      setDisplayFormat(contentFormat);
    }
  }, [content, contentFormat, editingPost]);

  const showPostContent =
    (!poll || displayContent.trim() !== poll.question.trim()) &&
    (!event || displayContent.trim() !== event.title.trim());

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
    } catch (error: any) {
      console.error("React post failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    } finally {
      setLoadingReaction(false);
    }
  };

  const handleUpdatePost = async () => {
    if (isRichTextEmpty(editContent)) return;

    const sanitizedContent = sanitizePostHtml(editContent);

    try {
      await PostsApi.updatePost(postId, sanitizedContent, "HTML");
      setDisplayContent(sanitizedContent);
      setDisplayFormat("HTML");
      onUpdated?.(postId, sanitizedContent, "HTML");
      setEditingPost(false);
    } catch (error: any) {
      console.error("Update post failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    }
  };

  const handleDeletePost = async () => {
    const ok = window.confirm(t("pages.posts.deleteConfirm"));
    if (!ok) return;

    try {
      await PostsApi.deletePost(postId);
      onDeleted?.(postId);
    } catch (error: any) {
      console.error("Delete post failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    }
  };

  const handleToggleSavePost = async () => {
    if (savingPost) return;
    try {
      setSavingPost(true);
      const res = await PostsApi.toggleSavePost(postId);
      const nextSaved = res.data.isSaved;
      setIsSaved(nextSaved);
      onSavedChanged?.(postId, nextSaved);
      toast.success(nextSaved ? t("pages.posts.saved") : t("pages.posts.unsaved"));
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("pages.posts.saveFailed");
      toast.error(message);
    } finally {
      setSavingPost(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden relative ${
        isPinned ? "ring-1 ring-blue-500/20" : ""
      }`}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
            <img src={author.avatar} alt={author.name} />
          </div>

          <div>
            {author.id !== 0 ? (
              <Link to={`/profile/${author.id}`}>
                <h3 className="text-sm font-bold">{author.name}</h3>
              </Link>
            ) : (
              <h3 className="text-sm font-bold">{author.name}</h3>
            )}
            <p className="text-[11px] text-slate-500">
              {role} • {time}
            </p>
          </div>

          <div className="relative ml-auto flex items-center">
            {canPinPost && (
              <button
                type="button"
                onClick={() => setOpenConfirmPinPost(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                title={isPinned ? t("pages.posts.unpin") : t("pages.posts.pin")}
              >
                <Pin
                  size={18}
                  className={
                    isPinned ? "text-blue-700 fill-current" : undefined
                  }
                />
              </button>
            )}
            {user?.id === author.id && (
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-2 rounded-lg"
              >
                <EllipsisVertical size={18} />
              </button>
            )}

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
                  {t("pages.posts.edit")}
                </button>

                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} />
                  {t("pages.posts.delete")}
                </button>
              </div>
            )}
          </div>
        </div>

        {editingPost ? (
          <div className="mb-4">
            <RichTextEditor
              value={editContent}
              onChange={setEditContent}
              minRows={3}
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
                {t("common.cancel")}
              </button>

              <button
                type="button"
                onClick={handleUpdatePost}
                className="px-3 py-1.5 rounded-lg text-sm bg-blue-700 text-white font-semibold hover:bg-blue-800"
              >
                {t("pages.posts.save")}
              </button>
            </div>
          </div>
        ) : (
          showPostContent && (
            <RichTextContent
              content={displayContent}
              contentFormat={displayFormat}
              className="mb-4"
            />
          )
        )}

        {poll && !editingPost && (
          <div className="mb-4">
            <PollCard poll={poll} onVote={setPoll} />
          </div>
        )}
        {event && !editingPost && (
          <div className="mb-4">
            <EventCard event={event} onUpdated={setEvent} />
          </div>
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
                  {t("common.videoNotSupported")}
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
                    {file.fileName || t("common.attachmentFile")}
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

          <button
            type="button"
            onClick={() => onCopied?.(postId as number)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-700 transition-colors ml-auto"
          >
            <Share2 size={18} />
            <span className="text-xs font-semibold">{t("common.copyLink")}</span>
          </button>
          <button
            type="button"
            onClick={handleToggleSavePost}
            disabled={savingPost}
            className={`flex items-center gap-2 transition-colors disabled:opacity-60 ${
              isSaved
                ? "text-blue-700"
                : "text-slate-500 hover:text-blue-700"
            }`}
          >
            <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
            <span className="text-xs font-semibold">
              {isSaved ? t("pages.posts.savedState") : t("pages.posts.save")}
            </span>
          </button>
        </div>
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <CommentSection
              postId={postId}
              allowAnonymousComment={allowAnonymousComment}
            />
          </div>
        )}
      </div>
      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={imageAttachments.map((item) => ({ src: item.fileUrl }))}
      />

      {canPinPost && onPinned && (
        <ConfirmModal
          open={openConfirmPinPost}
          title={isPinned ? t("pages.posts.unpinTitle") : t("pages.posts.pinTitle")}
          description={
            isPinned
              ? t("pages.posts.unpinConfirm")
              : t("pages.posts.pinConfirm")
          }
          confirmText={t("common.confirm")}
          variant="primary"
          onCancel={() => setOpenConfirmPinPost(false)}
          onConfirm={async () => {
            setOpenConfirmPinPost(false);
            await onPinned(postId, pinGroupId, !isPinned);
          }}
        />
      )}
    </div>
  );
};

export default PostCard;
