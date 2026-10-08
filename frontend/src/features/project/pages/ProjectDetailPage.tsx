import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bug,
  CalendarRange,
  CircleDot,
  FileText,
  Flag,
  Flame,
  GitBranch,
  Globe,
  Info,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  ListTodo,
  Lock,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Plus,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Textarea from "@/components/shared/Textarea";
import { projectApi } from "@/features/project/api/project.api";
import ProjectMembersPanel from "@/features/project/components/members/ProjectMembersPanel";
import ProjectOverview from "@/features/project/components/overview/ProjectOverview";
import {
  UrgentSwitch,
  VisibilityPicker,
} from "@/features/project/components/ProjectFields";
import type {
  ProjectDetail,
  ProjectPriority,
  ProjectStatus,
  ProjectTab,
  UpdateProjectPayload,
} from "@/features/project/types/project.type";
import {
  formatProjectDate,
  toDateInputValue,
} from "@/features/project/utils/project-date";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { cn } from "@/lib/utils";

const TABS: ProjectTab[] = [
  "chat",
  "phases",
  "tasks",
  "bugs",
  "threads",
  "milestones",
  "members",
  "overview",
  "info",
];

const TAB_STYLE: Record<
  ProjectTab,
  {
    icon: LucideIcon;
    idle: string;
    active: string;
    text: string;
    line: string;
  }
> = {
  chat: {
    icon: MessageCircle,
    idle: "bg-sky-50 text-sky-600",
    active: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    line: "border-sky-500",
  },
  phases: {
    icon: Layers,
    idle: "bg-violet-50 text-violet-600",
    active: "bg-violet-100 text-violet-700",
    text: "text-violet-700",
    line: "border-violet-500",
  },
  tasks: {
    icon: ListTodo,
    idle: "bg-emerald-50 text-emerald-600",
    active: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    line: "border-emerald-500",
  },
  bugs: {
    icon: Bug,
    idle: "bg-rose-50 text-rose-600",
    active: "bg-rose-100 text-rose-700",
    text: "text-rose-700",
    line: "border-rose-500",
  },
  threads: {
    icon: MessagesSquare,
    idle: "bg-indigo-50 text-indigo-600",
    active: "bg-indigo-100 text-indigo-700",
    text: "text-indigo-700",
    line: "border-indigo-500",
  },
  milestones: {
    icon: Flag,
    idle: "bg-amber-50 text-amber-600",
    active: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    line: "border-amber-500",
  },
  members: {
    icon: Users,
    idle: "bg-teal-50 text-teal-600",
    active: "bg-teal-100 text-teal-700",
    text: "text-teal-700",
    line: "border-teal-500",
  },
  overview: {
    icon: LayoutDashboard,
    idle: "bg-blue-50 text-blue-600",
    active: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
    line: "border-blue-500",
  },
  info: {
    icon: Info,
    idle: "bg-slate-100 text-slate-600",
    active: "bg-slate-200 text-slate-700",
    text: "text-slate-800",
    line: "border-slate-500",
  },
};

const PRIORITIES: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES: ProjectStatus[] = [
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

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

const flowPalette = [
  { chip: "border-slate-200 bg-slate-100 text-slate-700", dot: "bg-slate-500" },
  { chip: "border-blue-200 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  { chip: "border-violet-200 bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  { chip: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  { chip: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
];

function flowChipStyle(isInitial: boolean, isFinal: boolean, index: number) {
  if (isFinal) return flowPalette[4];
  if (isInitial || index === 0) return flowPalette[0];
  return flowPalette[((index - 1) % 3) + 1];
}

type EditState = UpdateProjectPayload;

function toEditState(project: ProjectDetail): EditState {
  return {
    name: project.name,
    description: project.description ?? "",
    visibility: project.visibility,
    priority: project.priority,
    status: project.status,
    isUrgent: project.isUrgent,
    startDate: toDateInputValue(project.startDate),
    endDate: toDateInputValue(project.endDate),
  };
}

export default function ProjectDetailPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditState | null>(null);
  const [formError, setFormError] = useState("");
  const tabRefs = useRef<Partial<Record<ProjectTab, HTMLButtonElement | null>>>(
    {},
  );

  useEffect(() => {
    tabRefs.current[tab]?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
    });
  }, [tab, project?.id]);

  useEffect(() => {
    const id = Number(projectId);
    if (!Number.isInteger(id) || id <= 0) {
      setLoading(false);
      setError(t("pages.projects.notFound"));
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await projectApi.getProject(id);
        if (!cancelled) setProject(response.data);
      } catch (loadError) {
        if (!cancelled) {
          setProject(null);
          toastApiError(loadError);
          setError(t("pages.projects.notFound"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, t]);

  const handleMemberTotal = useCallback((total: number) => {
    setProject((current) =>
      current && current.memberCount !== total
        ? { ...current, memberCount: total }
        : current,
    );
  }, []);

  const startEdit = () => {
    if (!project) return;
    setForm(toEditState(project));
    setFormError("");
    setEditing(true);
    setTab("info");
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!project || !form) return;
    if (!form.name.trim()) {
      setFormError(t("pages.projects.nameRequired"));
      return;
    }
    if (!form.startDate || !form.endDate) {
      setFormError(t("pages.projects.dateRequired"));
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError(t("pages.projects.dateOrder"));
      return;
    }

    setSaving(true);
    try {
      const response = await projectApi.updateProject(project.id, {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
      });
      setProject(response.data);
      setEditing(false);
      toast.success(t("pages.projects.updated"));
    } catch (saveError) {
      toastApiError(saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="h-16 animate-pulse rounded-xl bg-white" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">
          {error || t("pages.projects.notFound")}
        </h1>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          {t("pages.projects.backToList")}
        </Link>
      </div>
    );
  }

  const VisibilityIcon = project.visibility === "PUBLIC" ? Globe : Lock;

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col md:min-h-svh">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              to="/projects"
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary"
            >
              <ArrowLeft className="size-3.5" />
              {t("pages.projects.backToList")}
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <h1 className="truncate text-xl font-bold text-slate-900">
                {project.name}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold",
                  statusClass[project.status],
                )}
              >
                {t(`pages.projects.status.${project.status}`)}
              </span>
              <span className="font-medium text-slate-500">
                {t("pages.projects.workflow")}: {project.workflowName}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <VisibilityIcon className="size-3.5" />
                {t(
                  project.visibility === "PUBLIC"
                    ? "pages.projects.public"
                    : "pages.projects.private",
                )}
              </span>
              {project.isUrgent && (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                  <Flame className="size-3.5" />
                  {t("pages.projects.urgentShort")}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {project.canEdit && (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="size-4" />
                {t("pages.projects.editInfo")}
              </button>
            )}
            <button
              type="button"
              disabled
              title={t("pages.projects.developing")}
              className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-primary/50 px-4 text-sm font-semibold text-white"
            >
              <Plus className="size-4" />
              {t("pages.projects.createTask")}
            </button>
          </div>
        </div>

        <div className="mt-4 -mb-4 flex gap-1 overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
          {TABS.map((item) => {
            const style = TAB_STYLE[item];
            const Icon = style.icon;
            const active = tab === item;
            return (
              <button
                key={item}
                ref={(node) => {
                  tabRefs.current[item] = node;
                }}
                type="button"
                onClick={() => setTab(item)}
                className={cn(
                  "inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-2.5 py-2.5 text-sm font-medium whitespace-nowrap",
                  active
                    ? cn(style.line, style.text)
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md",
                    active ? style.active : style.idle,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {t(`pages.projects.tabs.${item}`)}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 bg-slate-50 px-4 py-6 sm:px-6">
        {tab === "info" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {editing && form ? (
              <form className="space-y-4" onSubmit={handleSave}>
                <Field
                  label={t("pages.projects.name")}
                  htmlFor="edit-name"
                  required
                >
                  <Input
                    id="edit-name"
                    value={form.name}
                    maxLength={150}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </Field>
                <Field
                  label={t("pages.projects.descriptionLabel")}
                  htmlFor="edit-description"
                >
                  <Textarea
                    id="edit-description"
                    value={form.description ?? ""}
                    maxLength={2000}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                  />
                </Field>
                <Field label={t("pages.projects.visibility")}>
                  <VisibilityPicker
                    value={form.visibility}
                    onChange={(visibility) => setForm({ ...form, visibility })}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t("pages.projects.startDate")} htmlFor="edit-start" required>
                    <Input
                      id="edit-start"
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm({ ...form, startDate: event.target.value })
                      }
                    />
                  </Field>
                  <Field label={t("pages.projects.endDate")} htmlFor="edit-end" required>
                    <Input
                      id="edit-end"
                      type="date"
                      value={form.endDate}
                      onChange={(event) =>
                        setForm({ ...form, endDate: event.target.value })
                      }
                    />
                  </Field>
                  <Field label={t("pages.projects.statusLabel")} htmlFor="edit-status">
                    <Select
                      id="edit-status"
                      value={form.status}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as ProjectStatus,
                        })
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(`pages.projects.status.${status}`)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("pages.projects.priority")} htmlFor="edit-priority">
                    <Select
                      id="edit-priority"
                      value={form.priority}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          priority: event.target.value as ProjectPriority,
                        })
                      }
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {t(`pages.projects.priorities.${priority}`)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <UrgentSwitch
                  checked={form.isUrgent}
                  onChange={(isUrgent) => setForm({ ...form, isUrgent })}
                />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditing(false)}
                    className="h-10 cursor-pointer rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                  >
                    {saving ? t("common.processing") : t("common.save")}
                  </button>
                </div>
              </form>
            ) : (
              <InfoView project={project} language={i18n.language} />
            )}
          </section>
        ) : tab === "overview" ? (
          <ProjectOverview />
        ) : tab === "members" ? (
          <ProjectMembersPanel
            projectId={project.id}
            onTotalChange={handleMemberTotal}
          />
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-slate-800">
              {t("pages.projects.developing")}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {t("pages.projects.developingDescription")}
            </p>
            <button
              type="button"
              onClick={() => setTab("info")}
              className="mt-4 cursor-pointer text-sm font-semibold text-primary"
            >
              {t("pages.projects.openInfo")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBadge({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

function InfoView({
  project,
  language,
}: {
  project: ProjectDetail;
  language: string;
}) {
  const { t } = useTranslation();
  const VisibilityIcon = project.visibility === "PUBLIC" ? Globe : Lock;
  const rows: Array<{
    icon: LucideIcon;
    iconClass: string;
    label: string;
    value: ReactNode;
  }> = [
    {
      icon: FileText,
      iconClass: "bg-slate-100 text-slate-500",
      label: t("pages.projects.descriptionLabel"),
      value: project.description || t("pages.projects.noDescription"),
    },
    {
      icon: VisibilityIcon,
      iconClass:
        project.visibility === "PUBLIC"
          ? "bg-sky-50 text-sky-600"
          : "bg-slate-100 text-slate-500",
      label: t("pages.projects.visibility"),
      value: (
        <InfoBadge
          className={
            project.visibility === "PUBLIC"
              ? "bg-sky-50 text-sky-700"
              : "bg-slate-100 text-slate-600"
          }
        >
          <VisibilityIcon className="size-3" />
          {t(
            project.visibility === "PUBLIC"
              ? "pages.projects.public"
              : "pages.projects.private",
          )}
        </InfoBadge>
      ),
    },
    {
      icon: CalendarRange,
      iconClass: "bg-indigo-50 text-indigo-600",
      label: t("pages.projects.schedule"),
      value: `${formatProjectDate(project.startDate, language)} – ${formatProjectDate(project.endDate, language)}`,
    },
    {
      icon: CircleDot,
      iconClass: "bg-blue-50 text-blue-600",
      label: t("pages.projects.statusLabel"),
      value: (
        <InfoBadge className={statusClass[project.status]}>
          {t(`pages.projects.status.${project.status}`)}
        </InfoBadge>
      ),
    },
    {
      icon: Flag,
      iconClass: "bg-orange-50 text-orange-600",
      label: t("pages.projects.priority"),
      value: (
        <InfoBadge className={priorityClass[project.priority]}>
          {t(`pages.projects.priorities.${project.priority}`)}
        </InfoBadge>
      ),
    },
    {
      icon: Flame,
      iconClass: project.isUrgent
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-400",
      label: t("pages.projects.urgent"),
      value: project.isUrgent ? (
        <InfoBadge className="bg-amber-50 text-amber-700">
          <Flame className="size-3" />
          {t("pages.projects.yes")}
        </InfoBadge>
      ) : (
        t("pages.projects.no")
      ),
    },
    {
      icon: LayoutTemplate,
      iconClass: "bg-violet-50 text-violet-600",
      label: t("pages.projects.originTemplate"),
      value: `${project.templateName} · v${project.templateVersion}`,
    },
    {
      icon: GitBranch,
      iconClass: "bg-teal-50 text-teal-600",
      label: t("pages.projects.workflow"),
      value: project.workflowName,
    },
    {
      icon: UserRound,
      iconClass: "bg-primary/10 text-primary",
      label: t("pages.projects.createdBy"),
      value: project.createdBy.fullName,
    },
    {
      icon: Users,
      iconClass: "bg-emerald-50 text-emerald-600",
      label: t("pages.projects.members"),
      value: String(project.memberCount),
    },
  ];

  return (
    <div className="space-y-5">
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 py-3 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-4"
          >
            <dt className="flex items-center gap-2.5 text-sm text-slate-500">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  row.iconClass,
                )}
              >
                <row.icon className="size-3.5" />
              </span>
              {row.label}
            </dt>
            <dd className="text-sm font-medium text-slate-800">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="flex items-center gap-2.5 text-sm text-slate-500">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <CircleDot className="size-3.5" />
          </span>
          {t("pages.projects.statusFlow")}
        </p>
        {project.workflowStatuses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">—</p>
        ) : (
          <ol className="mt-3 flex flex-wrap items-center gap-2">
            {project.workflowStatuses.map((status, index) => {
              const tone = flowChipStyle(
                status.isInitial,
                status.isFinal,
                index,
              );
              return (
              <li key={status.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                    status.color ? "border-slate-200 bg-slate-50 text-slate-700" : tone.chip,
                  )}
                  style={
                    status.color
                      ? {
                          borderColor: status.color,
                          color: status.color,
                          backgroundColor: `${status.color}18`,
                        }
                      : undefined
                  }
                >
                  <span
                    className={cn("size-1.5 rounded-full", status.color ? "" : tone.dot)}
                    style={status.color ? { backgroundColor: status.color } : undefined}
                  />
                  {status.name}
                </span>
                {index < project.workflowStatuses.length - 1 && (
                  <span className="text-slate-300">→</span>
                )}
              </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
