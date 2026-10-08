import { Flame, Globe, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  ProjectListItem,
  ProjectPriority,
  ProjectStatus,
} from "@/features/project/types/project.type";
import { formatProjectDate } from "@/features/project/utils/project-date";
import { cn } from "@/lib/utils";

const statusClass: Record<ProjectStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  ON_HOLD: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

const priorityClass: Record<ProjectPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-orange-50 text-orange-700",
  URGENT: "bg-rose-50 text-rose-700",
};

type ProjectCardProps = {
  project: ProjectListItem;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const VisibilityIcon = project.visibility === "PUBLIC" ? Globe : Lock;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-base font-semibold text-slate-900">
          {project.name}
        </h2>
        {project.isUrgent && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
            <Flame className="size-3" />
            {t("pages.projects.urgentShort")}
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
        {project.description || t("pages.projects.noDescription")}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            statusClass[project.status],
          )}
        >
          {t(`pages.projects.status.${project.status}`)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            priorityClass[project.priority],
          )}
        >
          {t(`pages.projects.priorities.${project.priority}`)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          <VisibilityIcon className="size-3" />
          {t(
            project.visibility === "PUBLIC"
              ? "pages.projects.public"
              : "pages.projects.private",
          )}
        </span>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex justify-between gap-3">
          <dt>{t("pages.projects.schedule")}</dt>
          <dd className="text-right text-slate-700">
            {formatProjectDate(project.startDate, i18n.language)} –{" "}
            {formatProjectDate(project.endDate, i18n.language)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t("pages.projects.workflow")}</dt>
          <dd className="truncate text-slate-700">{project.workflowName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t("pages.projects.originTemplate")}</dt>
          <dd className="truncate text-slate-700">{project.templateName}</dd>
        </div>
      </dl>
    </Link>
  );
}
