import { useState } from "react";
import { type Member } from "@/features/group/types/group.type";
import { MemberRow } from "./MemberRow";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";
import {
  canManageGroupMembers,
  canManageTargetMember,
  type GroupMemberRole,
} from "@/features/group/utils/group-member";
import { useTranslation } from "react-i18next";

interface MemberTableProps {
  members: Member[];
  canManage: boolean;
  actorRole: GroupMemberRole | null;
  currentUserId?: number;
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onRemoveMember: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const MemberTable = ({
  members,
  canManage,
  actorRole,
  currentUserId,
  onAddMember,
  onEditMember,
  onRemoveMember,
  currentPage,
  totalPages,
  onPageChange,
}: MemberTableProps) => {
  const { t } = useTranslation();
  const showActionsColumn =
    canManage &&
    canManageGroupMembers(actorRole) &&
    members.some((m) =>
      canManageTargetMember(actorRole, m.memberRole, m.id, currentUserId),
    );
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleRemoveClick = (member: Member) => {
    setSelectedMember(member);
    setOpenConfirm(true);
  };

  const handleConfirmRemove = () => {
    if (!selectedMember) return;
    onRemoveMember(String(selectedMember.id));
    setOpenConfirm(false);
    setSelectedMember(null);
  };

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/30">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t("common.members")}
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t("common.email")}
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t("common.role")}
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t("common.joinedAt")}
              </th>
              {showActionsColumn && (
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">
                  {t("common.actions")}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={showActionsColumn ? 5 : 4}
                  className="px-6 py-10 text-center text-sm text-on-surface-variant"
                >
                  {t("pages.groups.noMembers")}
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  actorRole={actorRole}
                  currentUserId={currentUserId}
                  showActionsColumn={showActionsColumn}
                  onEdit={onEditMember}
                  onRemove={() => handleRemoveClick(member)}
                />
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between p-4 border-t border-outline-variant/20 bg-surface-container-low/50">
          {canManage ? (
            <button
              type="button"
              onClick={onAddMember}
              className="flex items-center gap-2 text-sm text-primary font-bold hover:underline transition-all"
            >
              <Plus size={16} />
              <span>{t("pages.groups.addMember")}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-2 rounded-lg border disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-medium">
              {t("pages.groups.page")} {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-2 rounded-lg border disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {openConfirm && selectedMember && (
        <ConfirmModal
          open={openConfirm}
          title={t("pages.chat.removeFromGroup")}
          description={t("pages.groups.removeMemberConfirm", { name: selectedMember.fullName })}
          confirmText={t("common.delete")}
          variant="primary"
          onCancel={() => {
            setOpenConfirm(false);
            setSelectedMember(null);
          }}
          onConfirm={handleConfirmRemove}
        />
      )}
    </>
  );
};
