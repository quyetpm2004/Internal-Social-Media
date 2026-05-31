import { Pencil, Trash2 } from "lucide-react";
import { type Member } from "@/features/group/types/group.type";
import {
  canManageTargetMember,
  formatGroupMemberRole,
  getRoleBadgeClass,
  type GroupMemberRole,
} from "@/features/group/utils/group-member";
import { NavLink } from "react-router-dom";
import { getDefaultAvatarUrl } from "@/lib/utils";

interface MemberRowProps {
  member: Member;
  actorRole: GroupMemberRole | null;
  currentUserId?: number;
  showActionsColumn: boolean;
  onEdit: (member: Member) => void;
  onRemove: () => void;
}

const RoleBadge = ({ role }: { role: string }) => {
  return (
    <span
      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase ${getRoleBadgeClass(role)}`}
    >
      {formatGroupMemberRole(role)}
    </span>
  );
};

export const MemberRow = ({
  member,
  actorRole,
  currentUserId,
  showActionsColumn,
  onEdit,
  onRemove,
}: MemberRowProps) => {
  const canManageThisMember = canManageTargetMember(
    actorRole,
    member.memberRole,
    member.id,
    currentUserId,
  );

  return (
    <tr className="hover:bg-surface-container/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            alt={member.fullName}
            className="w-10 h-10 rounded-lg object-cover"
            src={member.avatarUrl || getDefaultAvatarUrl(member.fullName)}
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

      {showActionsColumn && (
        <td className="px-6 py-4 text-right">
          {canManageThisMember ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(member)}
                title="Sửa quyền"
                className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              >
                <Pencil size={18} />
              </button>
              <button
                type="button"
                title="Xóa khỏi nhóm"
                onClick={onRemove}
                className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : null}
        </td>
      )}
    </tr>
  );
};
