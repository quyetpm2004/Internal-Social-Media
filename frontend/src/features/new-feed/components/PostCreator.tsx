import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart3,
  CalendarPlus,
  FileIcon,
  ImageIcon,
  Paperclip,
  PlayCircle,
  Video,
  X,
  Loader2,
} from "lucide-react";

import { PostsApi } from "@/features/new-feed/api/post.api";
import RichTextEditor from "@/features/new-feed/components/RichTextEditor";
import PollForm from "@/components/poll/PollForm";
import EventForm from "@/components/event/EventForm";
import {
  isRichTextEmpty,
  sanitizePostHtml,
} from "@/features/new-feed/utils/rich-text";
import { uploadApi } from "@/features/uploads/api/upload.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { toast } from "sonner";
import { getDefaultAvatarUrl } from "@/lib/utils";
import type { PollInput } from "@/types/poll.type";
import type { EventInput } from "@/types/event.type";
import { useTranslation } from "react-i18next";

type PostCreatorProps = {
  fetchPosts: (currentPage: number) => Promise<void>;
  groupVisibility: "PUBLIC" | "GROUP";
  allowAnonymousPost?: boolean;
};

type UploadedAttachment = {
  attachmentId: number;
  key: string;
};

type PresignedUploadItem = {
  uploadUrl: string;
  key: string;
  attachmentId: number;
};

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message;
};

const PostCreator = ({
  fetchPosts,
  groupVisibility,
  allowAnonymousPost = false,
}: PostCreatorProps) => {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const user = useAuthStore((state) => state.user);

  const [content, setContent] = useState("");
  const [postAsAnonymous, setPostAsAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    { url: string; type: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [poll, setPoll] = useState<PollInput | null>(null);
  const [event, setEvent] = useState<EventInput | null>(null);

  const emptyPoll = (): PollInput => ({
    question: "",
    options: ["", ""],
    allowMultiple: false,
  });

  const isPollValid = (p: PollInput) =>
    p.question.trim().length > 0 &&
    p.options.filter((o) => o.trim().length > 0).length >= 2;

  const emptyEvent = (): EventInput => {
    const now = new Date();
    const plusHour = new Date(now.getTime() + 60 * 60 * 1000);
    const toInputValue = (d: Date) => {
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };
    return {
      title: "",
      description: "",
      startAt: toInputValue(now),
      endAt: toInputValue(plusHour),
      location: "",
    };
  };

  const isEventValid = (e: EventInput) => {
    if (!e.title.trim() || !e.startAt) return false;
    const start = new Date(e.startAt);
    if (Number.isNaN(start.getTime())) return false;
    if (e.endAt) {
      const end = new Date(e.endAt);
      if (Number.isNaN(end.getTime()) || end < start) return false;
    }
    return true;
  };

  // Xử lý tạo Preview và Cleanup
  useEffect(() => {
    if (attachments.length === 0) {
      setPreviews([]);
      return;
    }

    const previewData = attachments.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
    }));

    setPreviews(previewData);

    return () => {
      previewData.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [attachments]);

  const handleSelectFiles = (
    e: React.ChangeEvent<HTMLInputElement>,
    filterType: "image" | "video" | "all",
  ) => {
    const files = Array.from(e.target.files ?? []);
    let filteredFiles = files;

    if (filterType === "image") {
      filteredFiles = files.filter((f) => f.type.startsWith("image/"));
    } else if (filterType === "video") {
      filteredFiles = files.filter((f) => f.type.startsWith("video/"));
    }

    setAttachments((prev) => [...prev, ...filteredFiles]);
    e.target.value = ""; // Reset input
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFilePurpose = (file: File) => {
    if (file.type.startsWith("image/")) return "post-image";
    if (file.type.startsWith("video/")) return "post-video";
    return "post-file";
  };

  const uploadAttachments = async (): Promise<UploadedAttachment[]> => {
    if (attachments.length === 0) return [];

    // 1. Lấy link Presign
    const presignRes = await uploadApi.presign(
      attachments.map((file) => ({
        purpose: getFilePurpose(file),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })),
    );

    const items = presignRes.data.items as PresignedUploadItem[];

    // 2. Upload song song lên S3
    await Promise.all(
      items.map(async (item, index: number) => {
        const file = attachments[index];
        const uploadRes = await fetch(item.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error(t("pages.chat.uploadFailed"));
      }),
    );

    // 3. Xác nhận upload thành công với Backend
    await uploadApi.confirm(
      items.map((item, index: number) => ({
        purpose: getFilePurpose(attachments[index]),
        key: item.key,
        attachmentId: item.attachmentId,
      })),
    );

    return items.map((item) => ({
      key: item.key,
      attachmentId: item.attachmentId,
    }));
  };

  const handleCreatePost = async () => {
    const hasPoll = poll !== null && isPollValid(poll);
    const hasEvent = event !== null && isEventValid(event);
    if (
      isRichTextEmpty(content) &&
      attachments.length === 0 &&
      !hasPoll &&
      !hasEvent
    )
      return;

    const sanitizedContent = sanitizePostHtml(content);

    try {
      setLoading(true);
      const uploadedAttachments = await uploadAttachments();

      const pollPayload = hasPoll
        ? {
            question: poll!.question.trim(),
            options: poll!.options.map((o) => o.trim()).filter(Boolean),
            allowMultiple: poll!.allowMultiple,
          }
        : undefined;
      const eventPayload = hasEvent
        ? {
            title: event!.title.trim(),
            description: event!.description?.trim() || undefined,
            startAt: new Date(event!.startAt).toISOString(),
            endAt: event!.endAt
              ? new Date(event!.endAt).toISOString()
              : undefined,
            location: event!.location?.trim() || undefined,
          }
        : undefined;

      const res = await PostsApi.createPost({
        content: sanitizedContent,
        contentFormat: "HTML",
        visibility: groupVisibility,
        groupId: groupId ? Number(groupId) : undefined,
        attachmentIds: uploadedAttachments.map((item) => item.attachmentId),
        isAnonymous:
          groupVisibility === "GROUP" && allowAnonymousPost && postAsAnonymous,
        poll: pollPayload,
        event: eventPayload,
      });

      toast.success(
        res.data.status === "PENDING_REVIEW"
          ? t("pages.posts.pendingReview")
          : t("pages.posts.createSuccess"),
      );

      // Reset Form
      setContent("");
      setAttachments([]);
      setPostAsAnonymous(false);
      setPoll(null);
      setEvent(null);
      await fetchPosts(1);
    } catch (error: unknown) {
      console.error("Create post failed:", error);
      const message = getErrorMessage(error) || t("common.genericError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
          <img
            src={user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={t("pages.posts.creatorPlaceholder")}
            minRows={3}
          />

          {/* Hidden Inputs */}
          <input
            id="post-images"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleSelectFiles(e, "image")}
          />
          <input
            id="post-videos"
            type="file"
            accept="video/*"
            multiple
            hidden
            onChange={(e) => handleSelectFiles(e, "video")}
          />
          <input
            id="post-files"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
            multiple
            hidden
            onChange={(e) => handleSelectFiles(e, "all")}
          />

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {previews.map((item, index) => (
                <div
                  key={index}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm aspect-video"
                >
                  {item.type.startsWith("image/") ? (
                    <img
                      src={item.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : item.type.startsWith("video/") ? (
                    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                      <video
                        src={item.url}
                        className="w-full h-full object-contain opacity-70"
                      />
                      <PlayCircle
                        className="absolute text-white/80 group-hover:text-white transition-colors"
                        size={32}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                      <FileIcon size={28} className="text-blue-500 mb-2" />
                      <span className="text-[10px] font-medium line-clamp-1 dark:text-slate-300">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="absolute top-1.5 right-1.5 bg-black/40 hover:bg-red-500 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {poll && (
            <PollForm
              value={poll}
              onChange={setPoll}
              onRemove={() => setPoll(null)}
            />
          )}
          {event && (
            <EventForm
              value={event}
              onChange={setEvent}
              onRemove={() => setEvent(null)}
            />
          )}

          {allowAnonymousPost && groupVisibility === "GROUP" && (
            <label className="mt-4 flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={postAsAnonymous}
                onChange={(e) => setPostAsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t("pages.posts.anonymousPostHint")}
              </span>
            </label>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-1.5">
              <label
                htmlFor="post-images"
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors"
                title={t("pages.chat.image")}
              >
                <ImageIcon size={20} />
              </label>
              <label
                htmlFor="post-videos"
                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors"
                title={t("pages.chat.video")}
              >
                <Video size={20} />
              </label>
              <label
                htmlFor="post-files"
                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg cursor-pointer transition-colors"
                title={t("pages.chat.file")}
              >
                <Paperclip size={20} />
              </label>
              <button
                type="button"
                onClick={() => setPoll((prev) => prev ?? emptyPoll())}
                disabled={Boolean(event)}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  poll
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                }`}
                title={t("pages.chat.poll")}
              >
                <BarChart3 size={20} />
              </button>
              <button
                type="button"
                onClick={() => setEvent((prev) => prev ?? emptyEvent())}
                disabled={Boolean(poll)}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  event
                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                    : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                }`}
                title={t("pages.posts.event")}
              >
                <CalendarPlus size={20} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCreatePost}
              disabled={
                loading ||
                (isRichTextEmpty(content) &&
                  attachments.length === 0 &&
                  !(poll && isPollValid(poll)) &&
                  !(event && isEventValid(event)))
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t("common.processing") : t("pages.posts.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
