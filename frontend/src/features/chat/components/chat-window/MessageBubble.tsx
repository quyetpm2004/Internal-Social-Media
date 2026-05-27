import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Check,
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type {
  ChatMessage,
  ChatUser,
  ConversationType,
  MessageAttachment,
} from "@/features/chat/types/chat.type";
import { formatMessageTime } from "@/features/chat/utils/format-message-time";
import { formatFileSize } from "@/features/chat/utils/format-file-size";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  /** Danh sách user đã đọc đến đúng tin nhắn này (kể cả conversation 1-1) */
  readers?: ChatUser[];
  /** Đây có phải là own message mới nhất hay không (dùng để hiển thị "Đã gửi") */
  isLatestOwn?: boolean;
  conversationType?: ConversationType;
  onEdit?: (messageId: number, content: string) => Promise<void> | void;
  onDelete?: (messageId: number) => Promise<void> | void;
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
        className={`block rounded-xl overflow-hidden border-4 shadow-sm w-72 ${
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
        className={`w-72 rounded-xl overflow-hidden border-4 shadow-sm ${
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
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border w-72 ${
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

const ReaderAvatar = ({ user, size = 14 }: ReaderAvatarProps) => {
  const style = { width: size, height: size };
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        title={`Đã xem bởi ${user.fullName}`}
        style={style}
        className="rounded-full object-cover ring-1 ring-surface-container-lowest"
      />
    );
  }
  return (
    <div
      style={style}
      title={`Đã xem bởi ${user.fullName}`}
      className="rounded-full bg-primary text-on-primary text-[8px] font-bold flex items-center justify-center ring-1 ring-surface-container-lowest"
    >
      {user.fullName.charAt(0).toUpperCase()}
    </div>
  );
};

interface ReadReceiptProps {
  readers?: ChatUser[];
  isLatestOwn: boolean;
  conversationType: ConversationType;
  isDeleted: boolean;
}

const ReadReceiptIndicator = ({
  readers,
  isLatestOwn,
  conversationType,
  isDeleted,
}: ReadReceiptProps) => {
  if (isDeleted) return null;

  if (readers && readers.length > 0) {
    if (conversationType === "DIRECT") {
      const reader = readers[0];
      return (
        <span className="flex items-center gap-1 text-primary font-bold">
          <ReaderAvatar user={reader} size={14} />
          <span>Đã xem</span>
        </span>
      );
    }

    const visible = readers.slice(0, 3);
    const extra = readers.length - visible.length;
    return (
      <span className="flex items-center gap-1">
        <span className="flex -space-x-1.5">
          {visible.map((user) => (
            <ReaderAvatar key={user.id} user={user} size={14} />
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
        className="flex items-center gap-0.5 text-on-surface-variant"
        title="Đã gửi"
      >
        <Check size={12} />
        <span className="text-[9px] uppercase tracking-wider">Đã gửi</span>
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
        aria-label="Tùy chọn"
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
              <Pencil size={14} />
              Chỉnh sửa
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
            <Trash2 size={14} />
            Thu hồi
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
        placeholder="Nội dung..."
      />
      <div className="flex justify-end gap-2 px-2 py-2 border-t border-outline-variant/40">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1 text-xs font-bold rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          Hủy
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
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
};

const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  readers,
  isLatestOwn,
  conversationType = "DIRECT",
  onEdit,
  onDelete,
}: MessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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
    if (!window.confirm("Bạn có chắc muốn thu hồi tin nhắn này?")) return;
    await onDelete(message.id);
  };

  if (isOwn) {
    return (
      <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse group">
        <div className="space-y-1">
          {isDeleted ? (
            <div className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-tl-xl rounded-br-xl rounded-bl-xl text-xs italic">
              Bạn đã thu hồi tin nhắn
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
              {message.content && (
                <div className="bg-primary text-on-primary px-4 py-3 rounded-tl-xl rounded-br-xl rounded-bl-xl text-sm leading-relaxed shadow-md whitespace-pre-wrap wrap-break-word">
                  {message.content}
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-end gap-1.5 text-[10px] text-on-surface-variant font-medium mr-1">
            {message.status === "EDITED" && (
              <span className="italic">đã chỉnh sửa ·</span>
            )}
            <span>{time}</span>
            <ReadReceiptIndicator
              readers={readers}
              isLatestOwn={Boolean(isLatestOwn)}
              conversationType={conversationType}
              isDeleted={isDeleted}
            />
          </div>
        </div>

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

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="self-center p-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Đóng"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 max-w-[80%]">
      {showAvatar ? (
        message.sender.avatarUrl ? (
          <img
            alt={message.sender.fullName}
            className="w-8 h-8 rounded-lg shrink-0 mt-1 object-cover"
            src={message.sender.avatarUrl}
          />
        ) : (
          <div className="w-8 h-8 rounded-lg shrink-0 mt-1 bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center justify-center">
            {message.sender.fullName.charAt(0).toUpperCase()}
          </div>
        )
      ) : (
        <div className="w-8 h-8 shrink-0" />
      )}

      <div className="space-y-2">
        {showSenderName && (
          <span className="block text-[10px] font-bold text-on-surface-variant ml-1">
            {message.sender.fullName}
          </span>
        )}

        {isDeleted ? (
          <div className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-tr-xl rounded-br-xl rounded-bl-xl text-xs italic">
            Tin nhắn đã bị thu hồi
          </div>
        ) : (
          <>
            {message.attachments.map((attachment) =>
              renderAttachment(attachment, false),
            )}
            {message.content && (
              <div className="bg-surface-container px-4 py-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm leading-relaxed text-on-surface shadow-sm whitespace-pre-wrap wrap-break-word">
                {message.content}
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium ml-1">
          {message.status === "EDITED" && !isDeleted && (
            <span className="italic">đã chỉnh sửa ·</span>
          )}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
