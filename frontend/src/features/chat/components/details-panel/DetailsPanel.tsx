import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileSummary from "./ProfileSummary";
import SharedFiles from "./SharedFiles";
import SharedMedia from "./SharedMedia";
import PrivacySettings from "./PrivacySettings";
import { chatApi } from "@/features/chat/apis/chat.api";
import type {
  ConversationDetail,
  SharedAttachmentItem,
} from "@/features/chat/types/chat.type";

interface DetailsPanelProps {
  conversation: ConversationDetail;
  onMuteChanged?: (isMuted: boolean) => void;
  className?: string;
  showDetailPanel: boolean;
}

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
};

const DetailsPanel = ({
  conversation,
  onMuteChanged,
  className,
  showDetailPanel,
}: DetailsPanelProps) => {
  const [files, setFiles] = useState<SharedAttachmentItem[]>([]);
  const [media, setMedia] = useState<SharedAttachmentItem[]>([]);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [muteSubmitting, setMuteSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchAttachments = async () => {
      try {
        setLoadingFiles(true);
        setLoadingMedia(true);

        const [filesRes, mediaRes] = await Promise.all([
          chatApi.getSharedFiles(conversation.id, 1, 10),
          chatApi.getSharedMedia(conversation.id, 1, 6),
        ]);

        if (cancelled) return;

        setFiles(filesRes.data.items);
        setMedia(mediaRes.data.items);
        setMediaTotal(mediaRes.data.pagination.total);
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingFiles(false);
          setLoadingMedia(false);
        }
      }
    };

    fetchAttachments();

    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  const handleToggleMute = async () => {
    try {
      setMuteSubmitting(true);
      const next = !conversation.isMuted;
      const response = await chatApi.setMuted(conversation.id, next);
      onMuteChanged?.(response.data.isMuted);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMuteSubmitting(false);
    }
  };

  if (!showDetailPanel) {
    return;
  }

  return (
    <section
      className={`w-80 border-l border-outline-variant/30 bg-surface-container-low hidden xl:flex flex-col overflow-y-auto flex-shrink-0 ${className ?? ""}`}
    >
      <ProfileSummary conversation={conversation} />

      <div className="px-6 space-y-8 pb-10">
        <SharedFiles files={files} loading={loadingFiles} />

        <SharedMedia
          media={media}
          totalCount={mediaTotal}
          loading={loadingMedia}
        />

        <PrivacySettings
          muteNotifications={conversation.isMuted}
          submitting={muteSubmitting}
          onToggleMute={handleToggleMute}
        />
      </div>
    </section>
  );
};

export default DetailsPanel;
