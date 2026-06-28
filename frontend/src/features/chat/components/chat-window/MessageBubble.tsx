import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, Download, FileText, MoreHorizontal, X } from "lucide-react";
import type {
  ChatMessage,
  ChatUser,
  ConversationType,
  MessageAttachment,
} from "@/features/chat/types/chat.type";
import { formatMessageTime } from "@/features/chat/utils/format-message-time";
import { formatFileSize } from "@/features/chat/utils/format-file-size";
import { getDefaultAvatarUrl } from "@/lib/utils";
import PollCard from "@/components/poll/PollCard";
import MentionText from "@/features/mention/components/MentionText";
import type { PollSummary } from "@/types/poll.type";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  readers?: ChatUser[];
  isLatestOwn?: boolean;
  conversationType?: ConversationType;
  onEdit?: (messageId: number, content: string) => Promise<void> | void;
  onDelete?: (messageId: number) => Promise<void> | void;
  onPollVote?: (messageId: number, poll: PollSummary) => void;
  compact?: boolean;
}

const renderAttachment = (attachment: MessageAttachment, isOwn: boolean) => {
  if (
    attachment.attachmentType === "IMAGE" &&
    attachment.fileUrl &&
    attachment.mimeType.startsWith("image/")
  ) {
    return (
      <a
        key={attachment.id}
        href={attachment.fileUrl}
        target="_blank"
        rel="noreferrer"
        className={`block rounded-xl overflow-hidden border-4 shadow-sm w-52 ${
          isOwn ? "border-primary/20 ml-auto" : "border-surface-container"
        }`}
      >
        <img
          alt={attachment.fileName}
          className="w-full object-cover aspect-video"
          src={attachment.fileUrl}
        />
      </a>
    );
  }

  if (
    attachment.attachmentType === "VIDEO" &&
    attachment.fileUrl &&
    attachment.mimeType.startsWith("video/")
  ) {
    return (
      <video
        key={attachment.id}
        controls
        src={attachment.fileUrl}
        className={`w-52 rounded-xl overflow-hidden border-4 shadow-sm ${
          isOwn ? "border-primary/20 ml-auto" : "border-surface-container"
        }`}
      />
    );
  }

  return (
    <a
      key={attachment.id}
      href={attachment.fileUrl ?? undefined}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border w-52 ${
        isOwn
          ? "border-primary/20 bg-primary/5 ml-auto"
          : "border-outline-variant bg-surface-container"
      }`}
    >
      <div className="w-10 h-10 rounded-lg bg-error-container text-error flex items-center justify-center shrink-0">
        <FileText size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">
          {attachment.fileName}
        </p>
        <p className="text-[10px] text-on-surface-variant">
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      <Download size={16} className="text-on-surface-variant shrink-0" />
    </a>
  );
};

interface ReaderAvatarProps {
  user: ChatUser;
  size?: number;
}

const ReaderAvatar = ({
  user,
  size = 14,
  title,
}: ReaderAvatarProps & { title: string }) => {
  const style = { width: size, height: size };
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        title={title}
        style={style}
        className="rounded-full object-cover ring-1 ring-surface-container-lowest"
      />
    );
  }
  return (
    <img
      src={getDefaultAvatarUrl(user.fullName)}
      alt={user.fullName}
      title={title}
      style={style}
      className="rounded-full object-cover ring-1 ring-surface-container-lowest"
    />
  );
};

interface ReadReceiptProps {
  readers?: ChatUser[];
  isLatestOwn: boolean;
  conversationType: ConversationType;
  isDeleted: boolean;
  t: TFunction;
}

const ReadReceiptIndicator = ({
  readers,
  isLatestOwn,
  conversationType,
  isDeleted,
  t,
}: ReadReceiptProps) => {
  if (isDeleted) return null;

  if (readers && readers.length > 0) {
    if (conversationType === "DIRECT") {
      const reader = readers[0];
      return (
        <span className="flex items-center gap-1 text-primary font-bold mt-1">
          <ReaderAvatar
            user={reader}
            size={14}
            title={t("pages.chat.seenBy", { name: reader.fullName })}
          />
        </span>
      );
    }

    const visible = readers.slice(0, 3);
    const extra = readers.length - visible.length;
    return (
      <span className="flex items-center gap-1 mt-1">
        <span className="flex gap-x-0.5">
          {visible.map((user) => (
            <ReaderAvatar
              key={user.id}
              user={user}
              size={14}
              title={t("pages.chat.seenBy", { name: user.fullName })}
            />
          ))}
        </span>
        {extra > 0 && (
          <span className="text-[9px] font-bold text-on-surface-variant">
            +{extra}
          </span>
        )}
      </span>
    );
  }

  if (isLatestOwn) {
    return (
      <span
        className="flex items-center gap-0.5 text-on-surface-variant mt-1"
        title={t("pages.chat.sent")}
      >
        <Check size={12} />
        <span className="text-[9px] uppercase tracking-wider">
          {t("pages.chat.sent")}
        </span>
      </span>
    );
  }

  return null;
};

interface ActionsMenuProps {
  align: "left" | "right";
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const ActionsMenu = ({
  align,
  canEdit,
  onEdit,
  onDelete,
}: ActionsMenuProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
        aria-label={t("common.options")}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div
          className={`absolute z-10 mt-1 w-36 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-xl overflow-hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              {t("pages.posts.edit")}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-error hover:bg-error-container/40 transition-colors"
          >
            {t("pages.chat.recall")}
          </button>
        </div>
      )}
    </div>
  );
};

interface InlineEditorProps {
  initialValue: string;
  isOwn: boolean;
  saving: boolean;
  onSave: (next: string) => void;
  onCancel: () => void;
}

const InlineEditor = ({
  initialValue,
  isOwn,
  saving,
  onSave,
  onCancel,
}: InlineEditorProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(value.length, value.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const trimmed = value.trim();
      if (trimmed && trimmed !== initialValue) {
        onSave(trimmed);
      } else {
        onCancel();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className={`w-80 rounded-xl border shadow-sm overflow-hidden ${
        isOwn
          ? "border-primary/40 bg-primary/5"
          : "border-outline-variant bg-surface-container"
      }`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={saving}
        rows={3}
        className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm p-3 resize-none text-on-surface placeholder:text-on-surface-variant"
        placeholder={t("common.content")}
      />
      <div className="flex justify-end gap-2 px-2 py-2 border-t border-outline-variant/40">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1 text-xs font-bold rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => {
            const trimmed = value.trim();
            if (!trimmed || trimmed === initialValue) {
              onCancel();
              return;
            }
            onSave(trimmed);
          }}
          disabled={saving || !value.trim() || value.trim() === initialValue}
          className="px-3 py-1 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? t("common.processing") : t("pages.groups.saveChanges")}
        </button>
      </div>
    </div>
  );
};

const MessageBubble = ({
  message,
  isOwn,
  showSenderName,
  readers,
  isLatestOwn,
  conversationType = "DIRECT",
  onEdit,
  onDelete,
  onPollVote,
  compact = false,
}: MessageBubbleProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const ownBubbleClass = compact
    ? "bg-[#0084ff] text-white"
    : "bg-primary text-on-primary";
  const otherBubbleClass = compact
    ? "bg-[#f0f2f5] text-[#050505]"
    : "bg-surface-container text-on-surface";
  const deletedBubbleClass = compact
    ? "bg-[#f0f2f5] text-[#65676b]"
    : "bg-surface-container-high text-on-surface-variant";

  const time = formatMessageTime(message.createdAt);
  const isDeleted = message.status === "DELETED";

  const canEdit =
    isOwn && !isDeleted && message.contentType === "TEXT" && Boolean(onEdit);
  const canDelete = isOwn && !isDeleted && Boolean(onDelete);
  const showActions = canEdit || canDelete;

  const handleSaveEdit = async (next: string) => {
    if (!onEdit) return;
    try {
      setSavingEdit(true);
      await onEdit(message.id, next);
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm(t("pages.chat.recallConfirm"))) return;
    await onDelete(message.id);
  };

  if (message.contentType === "SYSTEM") {
    return (
      <div className="flex justify-center my-1 px-4">
        <p className="text-center text-[11px] leading-relaxed text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full max-w-[90%]">
          {message.content}
        </p>
      </div>
    );
  }

  const renderPoll = () => {
    if (message.contentType !== "POLL" || !message.poll || isDeleted)
      return null;
    return (
      <div className="w-52">
        <PollCard
          poll={message.poll}
          compact
          onVote={(updated) => onPollVote?.(message.id, updated)}
        />
      </div>
    );
  };

  if (isOwn) {
    return (
      <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse group">
        <div>
          <div className="text-[10px] text-blue-600 font-medium pb-0.5 text-right">
            {message.status === "EDITED" && (
              <span>{t("pages.chat.edited")}</span>
            )}
          </div>
          <div className="space-y-1">
            {isDeleted ? (
              <div className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-tl-xl rounded-br-xl rounded-bl-xl text-xs italic">
                {t("pages.chat.youRecalled")}
              </div>
            ) : isEditing ? (
              <InlineEditor
                initialValue={message.content}
                isOwn
                saving={savingEdit}
                onSave={handleSaveEdit}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                {message.attachments.map((attachment) =>
                  renderAttachment(attachment, true),
                )}
                {renderPoll()}
                {message.content && message.contentType !== "POLL" && (
                  <div className="flex items-center gap-1.5 justify-end">
                    {showActions && !isEditing && (
                      <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionsMenu
                          align="right"
                          canEdit={canEdit}
                          onEdit={() => setIsEditing(true)}
                          onDelete={handleDelete}
                        />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-medium opacity-0 group-hover:opacity-100">
                        {time}
                      </span>
                    </div>
                    <div
                      className={`${ownBubbleClass} px-3 py-1.5 rounded-xl w-fit text-sm leading-relaxed shadow-md whitespace-pre-wrap wrap-break-word`}
                    >
                      <MentionText
                        className={"text-white"}
                        content={message.content}
                        mentions={message.mentions}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-on-surface-variant font-medium">
            <ReadReceiptIndicator
              readers={readers}
              isLatestOwn={Boolean(isLatestOwn)}
              conversationType={conversationType}
              isDeleted={isDeleted}
              t={t}
            />
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="self-center p-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label={t("common.close")}
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="ml-11 -mb-1">
        {message.status === "EDITED" && !isDeleted && (
          <span className="text-[10px] text-blue-600 font-medium">
            {t("pages.chat.edited")}
          </span>
        )}
      </div>
      <div
        className={`flex gap-3 max-w-[80%] ${showSenderName ? "items-end" : "items-center"} relative group`}
      >
        <img
          alt={message.sender.fullName}
          className="w-8 h-8 rounded-full shrink-0 mt-1 object-cover"
          src={
            message.sender.avatarUrl ||
            getDefaultAvatarUrl(message.sender.fullName)
          }
        />

        <div className="space-y-2">
          {showSenderName && (
            <span
              className={`block text-[10px] font-bold ml-1 ${
                compact ? "text-[#65676b]" : "text-on-surface-variant"
              }`}
            >
              {message.sender.fullName}
            </span>
          )}

          {isDeleted ? (
            <div
              className={`${deletedBubbleClass} px-4 py-2 rounded-tr-xl rounded-br-xl rounded-bl-xl text-xs italic`}
            >
              {t("pages.chat.messageRecalled")}
            </div>
          ) : (
            <>
              {message.attachments.map((attachment) =>
                renderAttachment(attachment, false),
              )}
              {renderPoll()}
              {message.content && message.contentType !== "POLL" && (
                <div
                  className={`${otherBubbleClass} px-3 py-1.5 rounded-xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap wrap-break-word w-fit`}
                >
                  <MentionText
                    content={message.content}
                    mentions={message.mentions}
                  />
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant font-medium opacity-0 group-hover:opacity-100">
            {time}
          </span>
        </div>
      </div>
    </>
  );
};

export default MessageBubble;
