import type { TaskStatusInfo } from "@/features/project/types/task.type";

export type DependencyType = "FS" | "SS" | "FF" | "SF";
export type DependencyLogic = "AND" | "OR";
export type DependencySelectionMode = "MANUAL" | "AUTO";
export type DependencyLagUnit = "DAY" | "HOUR";

export type DependencyTaskRef = {
  id: number;
  code: string;
  title: string;
  status: TaskStatusInfo;
};

export type TaskDependency = {
  id: number;
  predecessor: DependencyTaskRef;
  relationshipType: DependencyType;
  lag: number;
  lagUnit: DependencyLagUnit;
};

export type DependencyGroup = {
  id: number;
  taskId: number;
  logicType: DependencyLogic;
  selectionMode: DependencySelectionMode;
  selectedDependencyId: number | null;
  dependencies: TaskDependency[];
};

export type TaskSuccessor = {
  id: number;
  successor: DependencyTaskRef;
  relationshipType: DependencyType;
  lag: number;
  lagUnit: DependencyLagUnit;
};

export type TaskDependencyView = {
  canEdit: boolean;
  groups: DependencyGroup[];
  successors: TaskSuccessor[];
};

export type SaveDependencyPayload = {
  predecessorTaskId: number;
  relationshipType: DependencyType;
  lag: number;
  lagUnit: DependencyLagUnit;
  groupId: number | null;
};

export type NewDependencyPayload = Omit<SaveDependencyPayload, "groupId">;

export type CreateDependencyGroupPayload = {
  logicType: DependencyLogic;
  selectionMode: DependencySelectionMode;
  dependencyIds: number[];
};

export type UpdateDependencyGroupPayload = {
  logicType: DependencyLogic;
  selectionMode: DependencySelectionMode;
  selectedDependencyId: number | null;
};
