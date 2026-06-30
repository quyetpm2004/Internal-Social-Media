import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileSummary from "@/features/chat/components/details-panel/ProfileSummary";
import GroupMembersList from "@/features/chat/components/details-panel/GroupMembersList";
import CreateChatGroupModal from "@/features/chat/components/details-panel/CreateChatGroupModal";
import SharedFiles from "@/features/chat/components/details-panel/SharedFiles";
import SharedMedia from "@/features/chat/components/details-panel/SharedMedia";
import { chatApi } from "@/features/chat/apis/chat.api";
import type {
  ConversationDetail,
  SharedAttachmentItem,
} from "@/features/chat/types/chat.type";
import { useTranslation } from "react-i18next";

interface DetailsPanelProps {
  conversation: ConversationDetail;
  currentUserId: number;
  onMuteChanged?: (isMuted: boolean) => void;
  onConversationUpdated: (conversation: ConversationDetail) => void;
  onGroupCreated: (conversationId: number) => void;
  onLeftGroup: () => void;
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
  currentUserId,
  // onMuteChanged,
  onConversationUpdated,
  onGroupCreated,
  onLeftGroup,
  className,
  showDetailPanel,
}: DetailsPanelProps) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<SharedAttachmentItem[]>([]);
  const [media, setMedia] = useState<SharedAttachmentItem[]>([]);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const isGroup = conversation.type === "GROUP";
  const counterpart = conversation.counterpart;

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

  const handleCreateGroup = async (data: {
    name: string;
    memberIds: number[];
  }) => {
    const res = await chatApi.createGroupConversation(data);
    onGroupCreated(res.data.id);
    toast.success(t("pages.chat.groupCreateSuccess"));
  };

  if (!showDetailPanel) {
    return null;
  }

  return (
    <>
      <section
        className={`w-80 border-l border-outline-variant/30 bg-surface-container-low hidden md:flex flex-col overflow-y-auto shrink-0 ${className ?? ""}`}
      >
        <ProfileSummary
          conversation={conversation}
          currentUserId={currentUserId}
          onConversationUpdated={onConversationUpdated}
          onCreateGroup={
            !isGroup && counterpart ? () => setCreateGroupOpen(true) : undefined
          }
        />

        {isGroup && (
          <GroupMembersList
            conversationId={conversation.id}
            members={conversation.members}
            currentUserId={currentUserId}
            onMembersUpdated={async () => {
              const res = await chatApi.getConversationDetail(conversation.id);
              onConversationUpdated(res.data);
            }}
            onLeftGroup={onLeftGroup}
          />
        )}

        <div className="px-6 space-y-8 pb-10">
          <SharedFiles files={files} loading={loadingFiles} />

          <SharedMedia
            media={media}
            totalCount={mediaTotal}
            loading={loadingMedia}
          />

          {/* <PrivacySettings
            muteNotifications={conversation.isMuted}
            submitting={muteSubmitting}
            onToggleMute={handleToggleMute}
          /> */}
        </div>
      </section>

      {counterpart && (
        <CreateChatGroupModal
          open={createGroupOpen}
          onClose={() => setCreateGroupOpen(false)}
          initialMember={counterpart}
          currentUserId={currentUserId}
          onSubmit={handleCreateGroup}
        />
      )}
    </>
  );
};

export default DetailsPanel;
