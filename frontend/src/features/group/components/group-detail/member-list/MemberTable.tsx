import { useState } from "react";
import { type Member } from "@/features/group/types/group.type";
import { MemberRow } from "./MemberRow";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";

interface MemberTableProps {
  members: Member[];

  onAddMember: () => void;

  onEditMember: (id: string) => void;
  onRemoveMember: (id: string) => void;

  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const MemberTable = ({
  members,
  onAddMember,
  onEditMember,
  onRemoveMember,
  currentPage,
  totalPages,
  onPageChange,
}: MemberTableProps) => {
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
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/30">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Thành viên
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Email
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Vai trò
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Ngày tham gia
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onEdit={() => onEditMember(String(member.id))}
                onRemove={() => handleRemoveClick(member)}
              />
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between p-4 border-t border-outline-variant/20 bg-surface-container-low/50">
          <button
            onClick={onAddMember}
            className="flex items-center gap-2 text-sm text-primary font-bold hover:underline transition-all"
          >
            <Plus size={16} />

            <span>Thêm thành viên</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-2 rounded-lg border disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-medium">
              Trang {currentPage} / {totalPages}
            </span>

            <button
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
          title="Xóa khỏi nhóm"
          description={`Bạn có chắc chắn muốn xóa ${selectedMember.fullName} khỏi nhóm?`}
          confirmText="Xóa"
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
