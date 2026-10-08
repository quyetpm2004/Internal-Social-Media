import { Building2, Clock, Globe, Lock, MessageSquare, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { GroupMembershipStatus } from "@/features/group/types/group.type";
import { DEFAULT_COVER } from "@/constants/app";
import { useTranslation } from "react-i18next";

type GroupCardProps = {
  groupId: string;
  groupName: string;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  description: string;
  memberCount: number;
  postCount?: number;
  coverUrl: string;
  isMember: boolean;
  membershipStatus?: GroupMembershipStatus;
  joinGroup: (groupId: string) => void;
};

const typeMeta = {
  PUBLIC: {
    labelKey: "common.public",
    icon: Globe,
    className: "bg-white/95 text-blue-700",
  },
  PRIVATE: {
    labelKey: "common.private",
    icon: Lock,
    className: "bg-white/95 text-violet-700",
  },
  DEPARTMENT: {
    labelKey: "common.department",
    icon: Building2,
    className: "bg-white/95 text-amber-700",
  },
} as const;

const GroupCard = ({
  groupId,
  groupName,
  groupType,
  description,
  memberCount,
  postCount,
  coverUrl,
  isMember,
  membershipStatus,
  joinGroup,
}: GroupCardProps) => {
  const { t } = useTranslation();
  const isPending = membershipStatus === "PENDING";
  const meta = typeMeta[groupType];
  const TypeIcon = meta.icon;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <NavLink to={`/groups/${groupId}`} className="relative block h-36 overflow-hidden">
        <img
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          src={coverUrl || DEFAULT_COVER}
          alt={groupName}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />
        <span
          className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
        >
          <TypeIcon size={12} />
          {t(meta.labelKey)}
        </span>
      </NavLink>

      <div className="flex flex-1 flex-col p-4">
        <NavLink to={`/groups/${groupId}`} className="min-w-0">
          <h3 className="line-clamp-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-700 dark:text-slate-100">
            {groupName}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">
            {description || t("pages.groups.noDescription")}
          </p>
        </NavLink>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users size={14} />
              {t("pages.groups.memberCount", {
                count: memberCount.toLocaleString(),
              })}
            </span>
            {typeof postCount === "number" && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare size={14} />
                {t("pages.groups.postCount", { count: postCount })}
              </span>
            )}
          </div>

          {isMember ? (
            <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {t("pages.groups.memberBadge")}
            </span>
          ) : isPending ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Clock size={12} />
              {t("pages.groups.pendingBadge")}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => joinGroup(groupId)}
              className="shrink-0 cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {groupType === "PRIVATE"
                ? t("pages.groups.requestJoin")
                : t("pages.groups.join")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default GroupCard;
