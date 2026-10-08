import { Calendar, MoreHorizontal, Pencil, UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  avatarColorClass,
  memberInitials,
  orderMemberRoles,
  roleBadgeClass,
} from "@/features/project/components/members/member-style";
import type {
  ProjectMemberItem,
  ProjectMemberRole,
} from "@/features/project/types/project.type";
import { formatProjectDate } from "@/features/project/utils/project-date";
import { cn } from "@/lib/utils";

type MemberCardProps = {
  member: ProjectMemberItem;
  roleCatalog: ProjectMemberRole[];
  canManage: boolean;
  language: string;
  onEdit: (member: ProjectMemberItem) => void;
  onRemove: (member: ProjectMemberItem) => void;
};

export default function MemberCard({
  member,
  roleCatalog,
  canManage,
  language,
  onEdit,
  onRemove,
}: MemberCardProps) {
  const { t } = useTranslation();
  const roles = orderMemberRoles(member.roles, roleCatalog);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="size-11">
          {member.avatarUrl && (
            <AvatarImage src={member.avatarUrl} alt={member.fullName} />
          )}
          <AvatarFallback
            className={cn("text-sm font-semibold", avatarColorClass(member.fullName))}
          >
            {memberInitials(member.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {member.fullName}
            </p>
            {member.isMe && (
              <span className="shrink-0 text-xs text-slate-400">
                {t("pages.projects.membersPanel.you")}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-slate-500">{member.email}</p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {roles.map((role) => (
            <span
              key={role.id}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                roleBadgeClass(role),
              )}
            >
              {role.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="size-3.5" />
            {t("pages.projects.membersPanel.joined", {
              date: formatProjectDate(member.joinedAt, language),
            })}
          </span>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("pages.projects.membersPanel.actions")}
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => onEdit(member)}
              >
                <Pencil />
                {t("pages.projects.membersPanel.changeRoles")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onSelect={() => onRemove(member)}
              >
                <UserMinus />
                {t("pages.projects.membersPanel.remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </article>
  );
}
