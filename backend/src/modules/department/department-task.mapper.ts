import { TemplateTaskRole } from "@prisma/client";
import type {
  DepartmentTaskDetailRow,
  DepartmentTaskListRow,
  DepartmentWorkflowRow,
} from "@/modules/department/department-task.repository";

function toIsoDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function mapDepartmentTaskListItem(task: DepartmentTaskListRow) {
  const assignee = task.members[0]?.user;
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    priority: task.priority,
    statusId: task.statusId,
    status: task.status,
    startDate: toIsoDate(task.startDate),
    dueDate: toIsoDate(task.dueDate),
    estimatedMinutes: task.estimatedMinutes,
    parentTaskId: task.parentTaskId,
    childCount: task._count.children,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    assignee: assignee ? { id: assignee.id, name: assignee.fullName } : null,
  };
}

export function mapDepartmentTaskDetail(
  task: DepartmentTaskDetailRow,
  avatarUrls: Map<string, string>,
) {
  const person = (role: TemplateTaskRole) => {
    const member = task.members.find((item) => item.taskRole === role);
    if (!member) return null;
    const avatarKey = member.user.profile?.avatarKey;
    return {
      userId: member.user.id,
      fullName: member.user.fullName,
      avatarUrl: avatarKey ? (avatarUrls.get(avatarKey) ?? null) : null,
    };
  };

  return {
    id: task.id,
    code: task.code,
    title: task.title,
    description: task.description,
    priority: task.priority,
    statusId: task.statusId,
    status: task.status,
    statusOptions: task.workflow.statuses,
    workflow: { id: task.workflow.id, name: task.workflow.name },
    startDate: toIsoDate(task.startDate),
    dueDate: toIsoDate(task.dueDate),
    estimatedMinutes: task.estimatedMinutes,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    parent: task.parent,
    children: task.children,
    assignee: person(TemplateTaskRole.ASSIGNEE),
    reporter: person(TemplateTaskRole.REPORTER),
  };
}

export function mapDepartmentTaskConfig(
  workflow: DepartmentWorkflowRow,
  counts: Map<number, number>,
) {
  return {
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? "",
    },
    statuses: workflow.statuses.map((status) => ({
      id: status.id,
      name: status.name,
      key: status.key,
      category: status.category,
      color: status.color,
      isInitial: status.isInitial,
      isFinal: status.isFinal,
      sortOrder: status.sortOrder,
      taskCount: counts.get(status.id) ?? 0,
    })),
  };
}
