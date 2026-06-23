import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import {
  BarChart3,
  FileText,
  Image as ImageIcon,
  Loader2,
  PlayCircle,
  Send,
  Smile,
  ThumbsUp,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PollForm from "@/components/poll/PollForm";
import {
  uploadApi,
  type PresignedItem,
  type UploadPurpose,
} from "@/features/uploads/api/upload.api";
import type { MessageContentType } from "@/features/chat/types/chat.type";
import type { PollInput } from "@/types/poll.type";
import { useTranslation } from "react-i18next";

export interface SendMessagePayload {
  content: string;
  contentType: MessageContentType;
  attachmentIds: number[];
  poll?: PollInput;
}

interface MessageInputProps {
  onSend: (payload: SendMessagePayload) => Promise<void> | void;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  compact?: boolean;
}

interface PreviewItem {
  file: File;
  url: string;
  kind: "image" | "video" | "file";
}

const getPreviewKind = (file: File): PreviewItem["kind"] => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
};

const getUploadPurpose = (file: File): UploadPurpose => {
  if (file.type.startsWith("image/")) return "message-image";
  if (file.type.startsWith("video/")) return "message-video";
  return "message-file";
};

const resolveContentType = (
  files: File[],
  hasText: boolean,
): MessageContentType => {
  if (files.length === 0) return "TEXT";
  const hasMedia = files.some(
    (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
  );
  if (hasMedia) return "IMAGE";
  if (files.length > 0) return "FILE";
  return hasText ? "TEXT" : "TEXT";
};

const MessageInput = ({
  onSend,
  disabled,
  onTypingStart,
  onTypingStop,
  compact = false,
}: MessageInputProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [poll, setPoll] = useState<PollInput | null>(null);

  const emptyPoll = (): PollInput => ({
    question: "",
    options: ["", ""],
    allowMultiple: false,
  });

  const isPollValid = (p: PollInput) =>
    p.question.trim().length > 0 &&
    p.options.filter((o) => o.trim().length > 0).length >= 2;

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);

  // Tạo preview URLs và cleanup khi attachments thay đổi
  useEffect(() => {
    if (attachments.length === 0) {
      setPreviews([]);
      return;
    }

    const items: PreviewItem[] = attachments.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      kind: getPreviewKind(file),
    }));

    setPreviews(items);

    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [attachments]);

  // Đóng emoji picker khi click ra ngoài
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const canSubmit = useMemo(() => {
    if (disabled || uploading) return false;
    if (poll) return isPollValid(poll);
    return value.trim().length > 0 || attachments.length > 0;
  }, [value, attachments, disabled, uploading, poll]);

  const handleSelectFiles = (
    event: ChangeEvent<HTMLInputElement>,
    accept: "image" | "video" | "file",
  ) => {
    const files = Array.from(event.target.files ?? []);
    let filtered = files;

    if (accept === "image") {
      filtered = files.filter((f) => f.type.startsWith("image/"));
    } else if (accept === "video") {
      filtered = files.filter((f) => f.type.startsWith("video/"));
    } else {
      filtered = files.filter(
        (f) => !f.type.startsWith("image/") && !f.type.startsWith("video/"),
      );
    }

    if (filtered.length > 0) {
      setAttachments((prev) => [...prev, ...filtered]);
    }

    event.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (files: File[]): Promise<number[]> => {
    if (files.length === 0) return [];

    const presignRes = await uploadApi.presign(
      files.map((file) => ({
        purpose: getUploadPurpose(file),
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      })),
    );

    const items: PresignedItem[] = presignRes.data.items;

    await Promise.all(
      items.map(async (item, index) => {
        const file = files[index];
        const res = await fetch(item.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!res.ok) {
          throw new Error(`${t("pages.chat.uploadFailed")}: ${file.name}`);
        }
      }),
    );

    await uploadApi.confirm(
      items.map((item, index) => ({
        purpose: getUploadPurpose(files[index]),
        key: item.key,
        attachmentId: item.attachmentId ?? undefined,
      })),
    );

    return items
      .map((item) => item.attachmentId)
      .filter((id): id is number => typeof id === "number");
  };

  const resetForm = () => {
    setValue("");
    setAttachments([]);
    setPoll(null);
    onTypingStop?.();
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();

    if (!canSubmit) return;

    if (poll && isPollValid(poll)) {
      try {
        setUploading(true);
        await onSend({
          content: "",
          contentType: "POLL",
          attachmentIds: [],
          poll: {
            question: poll.question.trim(),
            options: poll.options.map((o) => o.trim()).filter(Boolean),
            allowMultiple: poll.allowMultiple,
          },
        });
        resetForm();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : t("pages.chat.pollSendFailed");
        toast.error(message);
      } finally {
        setUploading(false);
      }
      return;
    }

    const trimmed = value.trim();
    const filesToUpload = [...attachments];
    const contentType = resolveContentType(filesToUpload, trimmed.length > 0);

    try {
      setUploading(true);

      const attachmentIds = await uploadAttachments(filesToUpload);

      await onSend({
        content: trimmed,
        contentType,
        attachmentIds,
      });

      resetForm();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("pages.chat.sendFailed");
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setValue(next);

    if (next.trim().length > 0) {
      onTypingStart?.();
    } else {
      onTypingStop?.();
    }
  };

  const handleBlur = () => {
    onTypingStop?.();
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setValue((prev) => prev + emojiData.emoji);
    onTypingStart?.();
    textareaRef.current?.focus();
  };

  const handleQuickLike = async () => {
    if (disabled || uploading) return;
    await onSend({
      content: "👍",
      contentType: "TEXT",
      attachmentIds: [],
    });
  };

  if (compact) {
    return (
      <footer className="p-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleSelectFiles(e, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={(e) => handleSelectFiles(e, "video")}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
          multiple
          hidden
          onChange={(e) => handleSelectFiles(e, "file")}
        />

        {previews.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto overscroll-contain">
            {previews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="relative rounded-lg overflow-hidden border border-[#e5e5e5] bg-[#f0f2f5] w-16 h-16 shrink-0"
              >
                {preview.kind === "image" ? (
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : preview.kind === "video" ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={preview.url}
                      className="w-full h-full object-cover opacity-80"
                      muted
                    />
                    <PlayCircle
                      size={20}
                      className="absolute text-white drop-shadow"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                    <FileText size={18} className="text-[#0866ff] mb-0.5" />
                    <span className="text-[8px] font-medium line-clamp-2 text-[#050505]">
                      {preview.file.name}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors"
                  aria-label={t("common.delete")}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="p-1.5 rounded-full text-[#0084ff] hover:bg-[#f2f2f2] transition-colors disabled:opacity-50"
            aria-label={t("pages.chat.attachImage")}
            title={t("pages.chat.image")}
          >
            <ImageIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="p-1.5 rounded-full text-[#0084ff] hover:bg-[#f2f2f2] transition-colors disabled:opacity-50"
            aria-label={t("pages.chat.attachVideo")}
            title={t("pages.chat.video")}
          >
            <VideoIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-1.5 rounded-full text-[#0084ff] hover:bg-[#f2f2f2] transition-colors disabled:opacity-50"
            aria-label={t("pages.chat.attachFile")}
            title={t("pages.chat.file")}
          >
            <FileText size={18} />
          </button>

          <div className="flex-1 relative flex items-center bg-[#f0f2f5] rounded-full px-3 py-1.5 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={t("pages.chat.messengerInputPlaceholder")}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={disabled || uploading}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-0.5 resize-none max-h-24 text-[#050505] placeholder:text-[#65676b] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              disabled={uploading}
              className="p-1 text-[#0084ff] hover:opacity-80 transition-opacity disabled:opacity-50"
              aria-label={t("pages.chat.emoji")}
            >
              <Smile size={18} />
            </button>

            {showEmojiPicker && (
              <div
                ref={emojiPanelRef}
                className="absolute bottom-12 right-0 z-50 shadow-2xl rounded-xl overflow-hidden"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  emojiStyle={EmojiStyle.NATIVE}
                  theme={Theme.LIGHT}
                  lazyLoadEmojis
                  searchPlaceholder={t("pages.chat.searchEmoji")}
                  width={280}
                  height={340}
                />
              </div>
            )}
          </div>

          {canSubmit ? (
            <button
              type="submit"
              disabled={!canSubmit}
              className="p-2 rounded-full text-[#0084ff] hover:bg-[#f2f2f2] transition-colors disabled:opacity-50"
              aria-label={t("pages.chat.send")}
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickLike}
              disabled={disabled || uploading}
              className="p-2 rounded-full text-[#0084ff] hover:bg-[#f2f2f2] transition-colors disabled:opacity-50"
              aria-label={t("pages.chat.sendLike")}
            >
              <ThumbsUp size={20} />
            </button>
          )}
        </form>
      </footer>
    );
  }

  return (
    <footer className="p-4 bg-surface-container-lowest">
      {poll && (
        <div className="max-w-4xl mx-auto mb-3">
          <PollForm
            value={poll}
            onChange={setPoll}
            onRemove={() => setPoll(null)}
          />
        </div>
      )}

      {previews.length > 0 && (
        <div className="max-w-4xl mx-auto mb-3 flex flex-wrap gap-2">
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${index}`}
              className="relative group rounded-xl overflow-hidden border border-outline-variant bg-surface-container w-24 h-24 shrink-0"
            >
              {preview.kind === "image" ? (
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="w-full h-full object-cover"
                />
              ) : preview.kind === "video" ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    src={preview.url}
                    className="w-full h-full object-cover opacity-80"
                    muted
                  />
                  <PlayCircle
                    size={28}
                    className="absolute text-white drop-shadow"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <FileText size={24} className="text-primary mb-1" />
                  <span className="text-[10px] font-medium line-clamp-2 text-on-surface">
                    {preview.file.name}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                aria-label={t("common.delete")}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-surface-container rounded-xl flex items-end p-2 gap-2 shadow-inner group focus-within:ring-2 focus-within:ring-primary/20 transition-all relative"
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleSelectFiles(e, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={(e) => handleSelectFiles(e, "video")}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
          multiple
          hidden
          onChange={(e) => handleSelectFiles(e, "file")}
        />

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            aria-label={t("pages.chat.attachImage")}
            title={t("pages.chat.image")}
          >
            <ImageIcon size={20} />
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            aria-label={t("pages.chat.attachVideo")}
            title={t("pages.chat.video")}
          >
            <VideoIcon size={20} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || Boolean(poll)}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            aria-label={t("pages.chat.attachFile")}
            title={t("pages.chat.file")}
          >
            <FileText size={20} />
          </button>
          <button
            type="button"
            onClick={() => setPoll((prev) => prev ?? emptyPoll())}
            disabled={uploading || attachments.length > 0}
            className={`p-2 transition-colors cursor-pointer disabled:opacity-50 ${
              poll
                ? "text-primary bg-primary/10"
                : "text-on-surface-variant hover:text-primary"
            }`}
            aria-label={t("pages.chat.createPoll")}
            title={t("pages.chat.poll")}
          >
            <BarChart3 size={20} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={
            poll ? t("pages.chat.creatingPoll") : t("pages.chat.typeMessage")
          }
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled || uploading || Boolean(poll)}
          className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-2 px-1 resize-none max-h-32 font-body text-on-surface placeholder:text-on-surface-variant disabled:opacity-60"
        />

        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={uploading}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            aria-label={t("pages.chat.emoji")}
          >
            <Smile size={22} />
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-primary text-on-primary w-10 h-10 rounded-lg flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            aria-label={t("pages.chat.send")}
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>

          {showEmojiPicker && (
            <div
              ref={emojiPanelRef}
              className="absolute bottom-14 right-0 z-50 shadow-2xl rounded-xl overflow-hidden"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                emojiStyle={EmojiStyle.NATIVE}
                theme={Theme.AUTO}
                lazyLoadEmojis
                searchPlaceholder={t("pages.chat.searchEmoji")}
                width={280}
                height={380}
              />
            </div>
          )}
        </div>
      </form>
    </footer>
  );
};

export default MessageInput;
