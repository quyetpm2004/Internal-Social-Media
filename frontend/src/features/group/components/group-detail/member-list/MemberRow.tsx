import { Pencil, Trash2 } from "lucide-react";
import { type Member, type Role } from "@/features/group/types/group.type";
import { NavLink } from "react-router-dom";

interface MemberRowProps {
  key: string;
  member: Member;
  onEdit: (id: string) => void;
  onRemove: () => void;
}

const RoleBadge = ({ role }: { role: Role }) => {
  const styles = {
    Admin: "bg-primary/10 text-primary border border-primary/20",
    Moderator: "bg-secondary-container text-on-secondary-container",
    Member: "bg-surface-container-high text-on-surface-variant",
  };

  return (
    <span
      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase ${styles[role]}`}
    >
      {role}
    </span>
  );
};

export const MemberRow = ({ member, onEdit, onRemove }: MemberRowProps) => {
  return (
    <>
      <tr className="hover:bg-surface-container/30 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              alt={member.fullName}
              className="w-10 h-10 rounded-lg object-cover"
              src={
                member.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  member.fullName || "User",
                )}`
              }
            />
            <NavLink to={`/profile/${member.id}`}>
              <div className="font-semibold text-sm text-on-surface">
                {member.fullName}
              </div>
            </NavLink>
          </div>
        </td>

        <td className="px-6 py-4 text-sm text-on-surface-variant">
          {member.email}
        </td>

        <td className="px-6 py-4">
          <RoleBadge role={member.memberRole} />
        </td>

        <td className="px-6 py-4 text-sm text-on-surface-variant">
          {new Date(member.joinedAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </td>

        <td className="px-6 py-4 text-right relative">
          <button
            // onClick={() => setOpen((v) => !v)}
            title="Sửa quyền"
            className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Pencil size={18} />
          </button>
          <button
            title="Xóa khỏi nhóm"
            onClick={onRemove}
            className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </td>
      </tr>
    </>
  );
};
