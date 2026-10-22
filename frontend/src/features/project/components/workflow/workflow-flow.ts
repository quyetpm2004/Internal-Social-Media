import type {
  ProjectWorkflow,
  ProjectWorkflowStatusDetail,
  WorkflowStatusCategory,
} from "@/features/project/types/project.type";

export const STATUS_KEY_REGEX = /^[A-Z][A-Z0-9_]{0,49}$/;

export const STATUS_CATEGORIES: WorkflowStatusCategory[] = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

export function pickWorkflowId(
  workflows: ProjectWorkflow[],
  prefer: number | null,
) {
  if (prefer != null && workflows.some((workflow) => workflow.id === prefer)) {
    return prefer;
  }
  return (
    workflows.find((workflow) => workflow.isDefault)?.id ??
    workflows[0]?.id ??
    null
  );
}

export function statusesForTaskMove(
  workflow: ProjectWorkflow,
  current: { workflowId: number; statusId: number } | null,
) {
  const statuses = [...workflow.statuses].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  if (
    current == null ||
    current.workflowId !== workflow.id ||
    workflow.transitionMode !== "STRICT"
  ) {
    return statuses;
  }

  const allowed = new Set<number>([current.statusId]);
  for (const transition of workflow.transitions) {
    if (transition.isActive && transition.fromStatusId === current.statusId) {
      allowed.add(transition.toStatusId);
    }
  }
  return statuses.filter((status) => allowed.has(status.id));
}

export function statusLabel(
  statuses: Array<{ id: number; name: string }>,
  statusId: number,
) {
  return statuses.find((status) => status.id === statusId)?.name ?? `#${statusId}`;
}

export function unreachableStatusIds(workflow: ProjectWorkflow): number[] {
  const initialStatuses = workflow.statuses.filter((status) => status.isInitial);
  if (initialStatuses.length !== 1) return [];

  const initial = initialStatuses[0]!;
  const next = new Map<number, number[]>();
  for (const transition of workflow.transitions) {
    if (!transition.isActive) continue;
    const list = next.get(transition.fromStatusId) ?? [];
    list.push(transition.toStatusId);
    next.set(transition.fromStatusId, list);
  }

  const reachable = new Set<number>([initial.id]);
  const queue = [initial.id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const target of next.get(current) ?? []) {
      if (!reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }

  return workflow.statuses
    .filter((status) => !reachable.has(status.id))
    .map((status) => status.id);
}

export function flagsForCategory(
  category: WorkflowStatusCategory,
  current: { isInitial: boolean; isFinal: boolean },
): {
  category: WorkflowStatusCategory;
  isInitial: boolean;
  isFinal: boolean;
} {
  if (category === "IN_PROGRESS") {
    return { category, isInitial: false, isFinal: false };
  }
  if (category === "DONE" || category === "CANCELLED") {
    return { category, isInitial: false, isFinal: true };
  }
  return { category, isInitial: current.isInitial, isFinal: false };
}

export function moveStatusIds(
  statuses: ProjectWorkflowStatusDetail[],
  index: number,
  direction: -1 | 1,
) {
  const target = index + direction;
  if (target < 0 || target >= statuses.length) return null;
  const ids = statuses.map((status) => status.id);
  const current = ids[index];
  const swap = ids[target];
  if (current === undefined || swap === undefined) return null;
  ids[index] = swap;
  ids[target] = current;
  return ids;
}
