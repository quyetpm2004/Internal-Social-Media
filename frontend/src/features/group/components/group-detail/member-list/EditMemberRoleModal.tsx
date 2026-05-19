import { useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Member } from "@/features/group/types/group.type";
import type { GroupMemberRole } from "@/features/group/utils/group-member";
import {
  formatGroupMemberRole,
  getAssignableRoles,
  GROUP_MEMBER_ROLE_OPTIONS,
} from "@/features/group/utils/group-member";

type EditMemberRoleModalProps = {
  open: boolean;
  loading?: boolean;
  member: Member | null;
  actorRole: GroupMemberRole;
  onClose: () => void;
  onSubmit: (memberRole: GroupMemberRole) => void;
};

export const EditMemberRoleModal = ({
  open,
  loading = false,
  member,
  actorRole,
  onClose,
  onSubmit,
}: EditMemberRoleModalProps) => {
  const assignableRoles = useMemo(
    () => getAssignableRoles(actorRole),
    [actorRole],
  );

  const [selectedRole, setSelectedRole] = useState<GroupMemberRole>(() => {
    if (!member) return "MEMBER";
    return assignableRoles.includes(member.memberRole)
      ? member.memberRole
      : (assignableRoles[0] ?? "MEMBER");
  });

  if (!open || !member) return null;

  const roleOptions = GROUP_MEMBER_ROLE_OPTIONS.filter((opt) =>
    assignableRoles.includes(opt.value),
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(selectedRole);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">
            Sửa quyền thành viên
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-on-surface-variant">
              Thành viên:{" "}
              <span className="font-semibold text-on-surface">
                {member.fullName}
              </span>
            </p>
            <p className="text-sm text-on-surface-variant">
              Quyền hiện tại: {formatGroupMemberRole(member.memberRole)}
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface px-1">
                Vai trò mới
              </label>
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as GroupMemberRole)
                }
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-high border-none outline-none focus:ring-2 focus:ring-surface-tint text-sm"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || selectedRole === member.memberRole}
              className="px-5 py-2.5 rounded-full text-sm font-bold bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
