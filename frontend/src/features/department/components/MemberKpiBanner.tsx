import { ArrowLeft, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import MemberAvatar from "@/features/department/components/MemberAvatar";
import type { DepartmentMember } from "@/features/department/types/department.type";
import { memberStatusTone } from "@/features/department/utils/department-task";

type MemberKpiBannerProps = {
  member: DepartmentMember;
  rank: number | null;
  total: number | null;
};

export default function MemberKpiBanner({
  member,
  rank,
  total,
}: MemberKpiBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Link
        to="/work/department/kpi"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        {t("department.memberKpi.back")}
      </Link>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <MemberAvatar id={member.id} name={member.name} className="size-12 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold tracking-tight text-slate-900">
            {member.name}
          </p>
          <p className="truncate text-sm text-slate-500">
            {member.position} · {member.email}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            memberStatusTone[member.status],
          )}
        >
          {t(`department.memberStatus.${member.status}`)}
        </span>
        {rank !== null && total !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Trophy className="size-3.5" />
            {t("department.memberKpi.rank", { rank, total })}
          </span>
        )}
      </div>
    </div>
  );
}
