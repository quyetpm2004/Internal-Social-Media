import { Role } from "@prisma/client";

/**
 * Phạm vi áp dụng của một quyền.
 * - ALL: mọi phòng ban / mọi dự án.
 * - OWN: chỉ phòng ban của chính người dùng.
 */
export type PermissionScope = "ALL" | "OWN";

export const PERMISSION_MATRIX = {
  "admin.access": { ADMIN: "ALL" },
  "account.manage": { ADMIN: "ALL" },
  "director.grant": { ADMIN: "ALL" },
  "moderation.manage": { ADMIN: "ALL" },
  "post.pin_global": { ADMIN: "ALL" },
  "template.manage": { ADMIN: "ALL" },

  "department.manage": { DIRECTOR: "ALL" },
  "department.appoint_manager": { DIRECTOR: "ALL" },
  "organization.dashboard.view": { DIRECTOR: "ALL" },

  "department.members.manage": { DIRECTOR: "ALL", MANAGER: "OWN" },
  "department.members.transfer": { DIRECTOR: "ALL" },
  "department.members.view": {
    DIRECTOR: "ALL",
    MANAGER: "OWN",
    EMPLOYEE: "OWN",
  },
  "department.dashboard.view": { DIRECTOR: "ALL", MANAGER: "OWN" },
  "department.tasks.view": {
    DIRECTOR: "ALL",
    MANAGER: "OWN",
    EMPLOYEE: "OWN",
  },
  "department.tasks.manage": { MANAGER: "OWN" },
  "department.tasks.update_assigned_status": {
    MANAGER: "OWN",
    EMPLOYEE: "OWN",
  },

  "department.own_workspace": { MANAGER: "OWN" },

  "self.work": { DIRECTOR: "ALL", MANAGER: "ALL", EMPLOYEE: "ALL" },

  "project.view_public": { DIRECTOR: "ALL", MANAGER: "ALL", EMPLOYEE: "ALL" },
  "project.view_private": { DIRECTOR: "ALL", MANAGER: "OWN" },
  "project.create": { DIRECTOR: "ALL", MANAGER: "OWN" },
  "project.reassign_manager": { DIRECTOR: "ALL", MANAGER: "OWN" },
} as const satisfies Record<string, Partial<Record<Role, PermissionScope>>>;

export type Permission = keyof typeof PERMISSION_MATRIX;
