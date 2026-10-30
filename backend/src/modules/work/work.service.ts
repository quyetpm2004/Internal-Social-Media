import { TemplateTaskRole } from "@prisma/client";
import type { MyTaskListQuery } from "@/modules/work/work.schema";
import * as workRepository from "@/modules/work/work.repository";

const ROLE_ORDER: TemplateTaskRole[] = [
  TemplateTaskRole.ASSIGNEE,
  TemplateTaskRole.REVIEWER,
  TemplateTaskRole.REPORTER,
];

function vietnamTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function utcDate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function addIsoDays(iso: string, days: number) {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateOnly(value: Date | null) {
  if (!value) return null;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pickMyRole(
  roles: TemplateTaskRole[],
  scope: MyTaskListQuery["scope"],
  preferred?: TemplateTaskRole,
) {
  if (preferred && roles.includes(preferred)) return preferred;
  if (scope === "assigned" && roles.includes(TemplateTaskRole.REPORTER)) {
    return TemplateTaskRole.REPORTER;
  }
  return (
    ROLE_ORDER.find((role) => roles.includes(role)) ??
    (scope === "assigned" ? TemplateTaskRole.REPORTER : TemplateTaskRole.ASSIGNEE)
  );
}

export async function listMyTasks(userId: number, query: MyTaskListQuery) {
  const todayIso = vietnamTodayIso();
  const today = utcDate(todayIso);
  const weekEnd = utcDate(addIsoDays(todayIso, 7));

  const filter = {
    userId,
    scope: query.scope,
    keyword: query.q,
    projectId: query.projectId,
    role: query.role,
    due: query.due,
    today,
    weekEnd,
  };

  const [rows, mine, assigned] = await Promise.all([
    workRepository.listMyTasks(filter),
    workRepository.countMyTasks(userId, "mine"),
    workRepository.countMyTasks(userId, "assigned"),
  ]);

  return {
    items: rows.map((row) => {
      const roles = [...new Set(row.members.map((member) => member.taskRole))];
      return {
        id: row.id,
        code: row.code,
        title: row.title,
        project: row.project,
        department: row.department,
        myRole: pickMyRole(roles, query.scope, query.role),
        status: row.status,
        dueDate: formatDateOnly(row.dueDate),
      };
    }),
    counts: { mine, assigned },
  };
}
