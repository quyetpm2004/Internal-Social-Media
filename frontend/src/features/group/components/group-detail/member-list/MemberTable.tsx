import { useState } from "react";
import { type Member } from "@/features/group/types/group.type";
import { MemberRow } from "./MemberRow";
import { Plus } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import Pagination from "@/components/shared/Pagination";
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
  total: number;
  limit: number;
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
  total,
  limit,
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.members")}</TableHead>
            <TableHead>{t("common.email")}</TableHead>
            <TableHead>{t("common.role")}</TableHead>
            <TableHead>{t("common.joinedAt")}</TableHead>
            {showActionsColumn && (
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActionsColumn ? 5 : 4}
                className="py-10 text-center whitespace-normal text-slate-500"
              >
                {t("pages.groups.noMembers")}
              </TableCell>
            </TableRow>
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
        </TableBody>
      </Table>

      {canManage && (
        <button
          type="button"
          onClick={onAddMember}
          className="mt-3 flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <Plus size={16} />
          <span>{t("pages.groups.addMember")}</span>
        </button>
      )}

      {totalPages > 1 && (
        <Pagination
          pagination={{ page: currentPage, limit, total, totalPages }}
          onPageChange={onPageChange}
        />
      )}

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
