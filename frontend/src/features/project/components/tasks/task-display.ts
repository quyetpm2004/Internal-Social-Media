import type { ProjectPriority } from "@/features/project/types/project.type";
import type { TaskStatusInfo } from "@/features/project/types/task.type";

const CATEGORY_COLOR: Record<TaskStatusInfo["category"], string> = {
  TODO: "#64748b",
  IN_PROGRESS: "#2563eb",
  DONE: "#059669",
  CANCELLED: "#e11d48",
};

export function taskStatusColor(status: {
  color: string | null;
  category?: TaskStatusInfo["category"];
}) {
  if (status.color) return status.color;
  if (status.category) return CATEGORY_COLOR[status.category];
  return "#64748b";
}

export const priorityBadgeClass: Record<ProjectPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-orange-50 text-orange-700",
  URGENT: "bg-rose-50 text-rose-700",
};

export function formatTaskCreated(value: string, language: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTaskDateTime(value: string, language: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
