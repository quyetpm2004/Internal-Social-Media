import { CheckCheck, FileText, Download } from "lucide-react";
import type {
  ChatMessage,
  MessageAttachment,
} from "@/features/chat/types/chat.type";
import { formatMessageTime } from "@/features/chat/utils/format-message-time";
import { formatFileSize } from "@/features/chat/utils/format-file-size";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  isRead?: boolean;
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

const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  isRead,
}: MessageBubbleProps) => {
  const time = formatMessageTime(message.createdAt);
  const isDeleted = message.status === "DELETED";

  if (isOwn) {
    return (
      <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
        <div className="space-y-1 text-right">
          {isDeleted ? (
            <div className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-tl-xl rounded-br-xl rounded-bl-xl text-xs italic">
              Bạn đã thu hồi tin nhắn
            </div>
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

          <div className="flex items-center justify-end gap-1 text-[10px] text-on-surface-variant font-medium mr-1">
            {message.status === "EDITED" && (
              <span className="italic">đã chỉnh sửa ·</span>
            )}
            <span>{time}</span>
            {!isDeleted && isRead && (
              <CheckCheck size={12} className="text-primary" />
            )}
            {!isDeleted && !isRead && (
              <CheckCheck size={12} className="text-on-surface-variant" />
            )}
          </div>
        </div>
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
