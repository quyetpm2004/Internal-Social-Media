import type { SystemRole } from "@/features/auth/types/auth.type";

export type Capability =
  | "orgOverview"
  | "manageDepartments"
  | "viewAnyDepartment"
  | "manageOwnDepartment"
  | "viewMyDepartment"
  | "createProject";

const capabilities: Record<SystemRole, ReadonlySet<Capability>> = {
  ADMIN: new Set(),
  DIRECTOR: new Set<Capability>([
    "orgOverview",
    "manageDepartments",
    "viewAnyDepartment",
    "createProject",
  ]),
  MANAGER: new Set<Capability>([
    "manageOwnDepartment",
    "viewMyDepartment",
    "createProject",
  ]),
  EMPLOYEE: new Set<Capability>(["viewMyDepartment"]),
};

export function can(role: SystemRole | undefined, capability: Capability) {
  return role ? capabilities[role].has(capability) : false;
}

export function workHomePath(role: SystemRole | undefined) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "DIRECTOR":
      return "/work";
    case "MANAGER":
      return "/work/department";
    default:
      return "/work/mine";
  }
}
