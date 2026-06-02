import { useMemo, useState } from "react";
import { ChevronDown, LogOut, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { chatApi } from "@/features/chat/apis/chat.api";
import type { ConversationMember } from "@/features/chat/types/chat.type";
import AddGroupMembersModal from "./AddGroupMembersModal";
import ConfirmModal from "@/components/common/ConfirmModal";

interface GroupMembersListProps {
  conversationId: number;
  members: ConversationMember[];
  currentUserId: number;
  onMembersUpdated: () => void;
  onLeftGroup: () => void;
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

const GroupMembersList = ({
  conversationId,
  members,
  currentUserId,
  onMembersUpdated,
  onLeftGroup,
}: GroupMembersListProps) => {
  const [expanded, setExpanded] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);

  const activeMembers = useMemo(() => members.filter((m) => m.user), [members]);

  const existingMemberIds = useMemo(
    () => activeMembers.map((m) => m.user.id),
    [activeMembers],
  );

  const isAdmin = useMemo(
    () =>
      activeMembers.some(
        (m) => m.user.id === currentUserId && m.role === "ADMIN",
      ),
    [activeMembers, currentUserId],
  );

  const handleLeaveGroup = async () => {
    try {
      setLeaving(true);
      await chatApi.leaveGroup(conversationId);
      onLeftGroup();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    try {
      await chatApi.removeGroupMember(conversationId, targetUserId);
      onMembersUpdated();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemovingUserId(null);
      setShowRemoveMemberConfirm(false);
    }
  };

  return (
    <div className="px-6 pb-4">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-on-surface">
          Thành viên trong đoạn chat
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-on-surface transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="mt-2 pl-1">
          <ul className="space-y-0.5">
            {activeMembers.map((member) => {
              const isSelf = member.user.id === currentUserId;
              const canRemove = isAdmin && !isSelf;

              return (
                <li
                  key={member.id}
                  className="flex items-center gap-3 py-2 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-secondary-container">
                    <img
                      src={
                        member.user.avatarUrl ||
                        getDefaultAvatarUrl(member.user.fullName)
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {member.user.fullName}
                      {isSelf ? " (Bạn)" : ""}
                    </p>
                    {member.role === "ADMIN" && (
                      <p className="text-xs text-on-surface-variant">
                        Quản trị viên
                      </p>
                    )}
                  </div>
                  {canRemove && (
                    <button
                      type="button"
                      disabled={removingUserId === member.user.id}
                      onClick={() => {
                        setShowRemoveMemberConfirm(true);
                        setRemovingUserId(member.user.id);
                      }}
                      className="p-1.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-all disabled:opacity-50 shrink-0"
                      aria-label={`Xóa ${member.user.fullName} khỏi nhóm`}
                      title="Xóa khỏi nhóm"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="mt-2 w-full flex items-center cursor-pointer justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <UserPlus size={18} />
            Thêm người
          </button>

          <button
            type="button"
            disabled={leaving}
            onClick={() => setShowLeaveConfirm(true)}
            className="mt-2 w-full flex items-center cursor-pointer justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors disabled:opacity-50"
          >
            <LogOut size={18} />
            {leaving ? "Đang rời nhóm..." : "Rời nhóm"}
          </button>
        </div>
      )}

      <AddGroupMembersModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        conversationId={conversationId}
        currentUserId={currentUserId}
        existingMemberIds={existingMemberIds}
        onAdded={onMembersUpdated}
      />

      <ConfirmModal
        open={showLeaveConfirm}
        title="Xóa khỏi nhóm"
        description="Bạn có chắc muốn rời nhóm này? Bạn sẽ không nhận được tin nhắn mới từ nhóm."
        confirmText="Rời nhóm"
        variant="primary"
        onCancel={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveGroup}
      />

      <ConfirmModal
        open={showRemoveMemberConfirm}
        title="Xóa khỏi nhóm"
        description="Bạn có chắc muốn xóa thành viên này khỏi nhóm? Bạn sẽ không nhận được tin nhắn mới từ nhóm."
        confirmText="Xóa"
        variant="primary"
        onCancel={() => setShowRemoveMemberConfirm(false)}
        onConfirm={() => handleRemoveMember(removingUserId!)}
      />
    </div>
  );
};

export default GroupMembersList;
