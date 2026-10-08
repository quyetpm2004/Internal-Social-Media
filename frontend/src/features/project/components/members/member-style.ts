import type { ProjectMemberRole } from "@/features/project/types/project.type";

const ROLE_BADGE: Record<string, string> = {
  PROJECT_MANAGER: "bg-slate-900 text-white",
  ADMIN: "bg-slate-900 text-white",
  DEV: "bg-blue-600 text-white",
  DEVELOPER: "bg-blue-600 text-white",
  QA: "bg-emerald-600 text-white",
  DESIGNER: "bg-violet-600 text-white",
  BA: "bg-orange-500 text-white",
};

const FALLBACK_BADGES = [
  "bg-sky-600 text-white",
  "bg-fuchsia-600 text-white",
  "bg-teal-600 text-white",
  "bg-rose-600 text-white",
];

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-700",
  "bg-slate-200 text-slate-700",
];

function hash(value: string) {
  let total = 0;
  for (const char of value) total += char.charCodeAt(0);
  return total;
}

export function roleBadgeClass(role: ProjectMemberRole) {
  return (
    ROLE_BADGE[role.key.toUpperCase()] ??
    FALLBACK_BADGES[hash(role.key) % FALLBACK_BADGES.length]
  );
}

export function avatarColorClass(name: string) {
  return AVATAR_COLORS[hash(name) % AVATAR_COLORS.length];
}

export function memberInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function sortRoles(roles: ProjectMemberRole[]) {
  return [...roles].sort((left, right) => {
    const order = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
    if (order !== 0) return order;
    return left.name.localeCompare(right.name, "vi");
  });
}

export function orderMemberRoles(
  memberRoles: ProjectMemberRole[],
  catalog: ProjectMemberRole[],
) {
  const index = new Map(
    sortRoles(catalog).map((role, position) => [role.id, position]),
  );
  return [...memberRoles].sort(
    (left, right) =>
      (index.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (index.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}
