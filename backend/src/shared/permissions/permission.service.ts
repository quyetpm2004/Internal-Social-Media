import { Role } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import {
  PERMISSION_MATRIX,
  type Permission,
  type PermissionScope,
} from "./permission.matrix";

export interface PermissionActor {
  id: number;
  role: Role | string;
  departmentId: number | null;
}

export type DepartmentScope =
  | { type: "ALL" }
  | { type: "DEPARTMENT"; departmentId: number };

export const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này";

export function getPermissionScope(
  role: Role | string,
  permission: Permission,
): PermissionScope | null {
  const rule = PERMISSION_MATRIX[permission] as Partial<
    Record<string, PermissionScope>
  >;
  return rule[role] ?? null;
}

export function can(role: Role | string, permission: Permission): boolean {
  return getPermissionScope(role, permission) !== null;
}

export function assertCan(role: Role | string, permission: Permission): void {
  if (!can(role, permission)) {
    throw new AppError(403, FORBIDDEN_MESSAGE);
  }
}

export function resolveDepartmentScope(
  actor: PermissionActor,
  permission: Permission,
): DepartmentScope {
  const scope = getPermissionScope(actor.role, permission);
  if (scope === null) {
    throw new AppError(403, FORBIDDEN_MESSAGE);
  }
  if (scope === "ALL") {
    return { type: "ALL" };
  }
  if (actor.departmentId === null) {
    throw new AppError(403, "Bạn chưa thuộc phòng ban nào");
  }
  return { type: "DEPARTMENT", departmentId: actor.departmentId };
}

export function isDepartmentInScope(
  scope: DepartmentScope,
  departmentId: number | null,
): boolean {
  if (scope.type === "ALL") return true;
  return departmentId !== null && departmentId === scope.departmentId;
}

export function assertDepartmentInScope(
  scope: DepartmentScope,
  departmentId: number | null,
): void {
  if (!isDepartmentInScope(scope, departmentId)) {
    throw new AppError(403, FORBIDDEN_MESSAGE);
  }
}

export function departmentWhere(scope: DepartmentScope) {
  return scope.type === "ALL" ? {} : { departmentId: scope.departmentId };
}
