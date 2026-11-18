import { Role, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import {
  assertDepartmentInScope,
  can,
  resolveDepartmentScope,
  type Permission,
  type PermissionActor,
} from "@/shared/permissions";
import { ROLE_BOUND_POSITION_KEYS } from "@/modules/position/position.repository";
import { buildPagination, paginate } from "@/shared/utils/pagination";
import * as kpiRepository from "@/modules/kpi/kpi.repository";
import type { DepartmentTaskRow } from "@/modules/kpi/kpi.repository";
import {
  rangeOf,
  round,
  summarize,
  toFacts,
  utcDate,
  vietnamIso,
} from "@/modules/kpi/kpi.service";
import type { TaskFacts } from "@/modules/kpi/kpi.service";
import type {
  AddMemberInput,
  CandidateListQuery,
  MemberListQuery,
  MemberTaskListQuery,
  TransferMemberInput,
  UpdateMemberInput,
} from "@/modules/department/department.schema";
import * as memberRepository from "@/modules/department/department-member.repository";
import type {
  MemberRow,
  OpenTaskRow,
} from "@/modules/department/department-member.repository";

const WEEKLY_CAPACITY_HOURS = 40;

function toIsoDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toMember(member: MemberRow, managerId: number | null) {
  return {
    id: member.id,
    name: member.fullName,
    email: member.email,
    position: member.position,
    avatarKey: member.profile?.avatarKey ?? null,
    isLeader: member.id === managerId,
  };
}

async function requireDepartment(
  actor: PermissionActor,
  departmentId: number,
  permission: Permission,
) {
  const scope = resolveDepartmentScope(actor, permission);
  assertDepartmentInScope(scope, departmentId);

  const department = await memberRepository.findDepartmentById(departmentId);
  if (!department) {
    throw new AppError(404, "Phòng ban không tồn tại");
  }
  return department;
}

async function requireMember(departmentId: number, userId: number) {
  const member = await memberRepository.findMemberInDepartment(
    departmentId,
    userId,
  );
  if (!member) {
    throw new AppError(404, "Nhân viên không thuộc phòng ban này");
  }
  return member;
}

async function requirePosition(positionId: number | null | undefined) {
  if (!positionId) return;
  const position = await memberRepository.findPositionById(positionId);
  if (!position) throw new AppError(404, "Chức vụ không tồn tại");
  if (ROLE_BOUND_POSITION_KEYS.includes(position.key)) {
    throw new AppError(
      400,
      "Chức danh này gắn với vai trò và không thể gán thủ công",
    );
  }
}

function workloadOf(tasks: OpenTaskRow[], memberId: number, todayIso: string) {
  const mine = tasks.filter((task) =>
    task.members.some((member) => member.userId === memberId),
  );
  const isLate = (task: OpenTaskRow) => {
    const due = toIsoDate(task.dueDate);
    return due !== null && due < todayIso;
  };

  const remainingHours = mine.reduce(
    (sum, task) =>
      sum +
      (task.estimatedMinutes ?? 0) / 60 / Math.max(task.members.length, 1),
    0,
  );

  const projects = new Map<
    number,
    { id: number; name: string; open: number; overdue: number }
  >();
  for (const task of mine) {
    const project = task.project;
    if (!project) continue;
    const entry = projects.get(project.id) ?? {
      id: project.id,
      name: project.name,
      open: 0,
      overdue: 0,
    };
    entry.open += 1;
    if (isLate(task)) entry.overdue += 1;
    projects.set(project.id, entry);
  }

  return {
    open: mine.length,
    overdue: mine.filter(isLate).length,
    dueToday: mine.filter((task) => toIsoDate(task.dueDate) === todayIso)
      .length,
    remainingHours: round(remainingHours),
    loadPercent: Math.round((remainingHours / WEEKLY_CAPACITY_HOURS) * 100),
    projects: [...projects.values()].sort((a, b) => b.open - a.open),
  };
}

export async function listMembers(
  actor: PermissionActor,
  departmentId: number,
  query: MemberListQuery,
) {
  const department = await requireDepartment(
    actor,
    departmentId,
    "department.members.view",
  );
  const members = await memberRepository.findMembers(
    department.id,
    query.search,
  );

  // Nhân viên chỉ xem danh sách (chỉ đọc), không xem KPI/khối lượng việc của đồng nghiệp.
  if (!can(actor.role, "department.dashboard.view")) {
    const { skip, take } = paginate(query.page, query.limit);
    return {
      department: { id: department.id, name: department.name },
      range: null,
      items: members
        .slice(skip, skip + take)
        .map((member) => toMember(member, department.managerId)),
      pagination: buildPagination(query.page, take, members.length),
    };
  }

  const memberIds = members.map((member) => member.id);

  const todayIso = vietnamIso(new Date());
  const range = rangeOf(query.period, todayIso);

  const [periodRows, openRows] = memberIds.length
    ? await Promise.all([
        kpiRepository.findDepartmentTasks(
          memberIds,
          utcDate(range.from),
          utcDate(range.to),
          query.projectId,
        ),
        memberRepository.findOpenTasks(memberIds, query.projectId),
      ])
    : [[], []];

  const facts = periodRows.map((row) =>
    toFacts(row, todayIso),
  ) as (TaskFacts & { row: DepartmentTaskRow })[];

  const enriched = members.map((member) => ({
    ...toMember(member, department.managerId),
    score: summarize(
      facts.filter((item) =>
        item.row.members.some((assignee) => assignee.userId === member.id),
      ),
    ).score,
    workload: workloadOf(openRows, member.id, todayIso),
  }));

  const sortValue = (item: (typeof enriched)[number]) => {
    if (query.sort === "kpi") return item.score;
    if (query.sort === "load") return item.workload.loadPercent;
    return item.workload.overdue;
  };

  const sorted =
    query.sort === "default"
      ? enriched
      : [...enriched].sort((left, right) => {
          const a = sortValue(left);
          const b = sortValue(right);
          if (a === null && b === null) return 0;
          if (a === null) return 1;
          if (b === null) return -1;
          return query.direction === "desc" ? b - a : a - b;
        });

  const { skip, take } = paginate(query.page, query.limit);

  return {
    department: { id: department.id, name: department.name },
    range,
    items: sorted.slice(skip, skip + take),
    pagination: buildPagination(query.page, take, sorted.length),
  };
}

export async function listMemberTasks(
  actor: PermissionActor,
  departmentId: number,
  userId: number,
  query: MemberTaskListQuery,
) {
  const department = await requireDepartment(
    actor,
    departmentId,
    "department.dashboard.view",
  );
  await requireMember(department.id, userId);

  const todayIso = vietnamIso(new Date());
  const { skip, take } = paginate(query.page, query.limit);
  const { items, total } = await memberRepository.findMemberOpenTasks(
    userId,
    query.projectId,
    skip,
    take,
  );

  return {
    items: items.map((task) => {
      const dueDate = toIsoDate(task.dueDate);
      return {
        id: task.id,
        code: task.code,
        title: task.title,
        priority: task.priority,
        project: task.project,
        status: task.status,
        dueDate,
        isOverdue: dueDate !== null && dueDate < todayIso,
        estimatedHours: round((task.estimatedMinutes ?? 0) / 60),
      };
    }),
    pagination: buildPagination(query.page, take, total),
  };
}

export async function listProjects(
  actor: PermissionActor,
  departmentId: number,
) {
  const department = await requireDepartment(
    actor,
    departmentId,
    "department.dashboard.view",
  );
  const members = await memberRepository.findMembers(department.id);
  if (members.length === 0) return [];

  return memberRepository.findDepartmentProjects(
    members.map((member) => member.id),
  );
}

export async function listCandidates(
  actor: PermissionActor,
  departmentId: number,
  query: CandidateListQuery,
) {
  await requireDepartment(actor, departmentId, "department.members.manage");

  const { skip, take } = paginate(query.page, query.limit);
  const { items, total } = await memberRepository.findCandidates(
    query.search,
    skip,
    take,
  );

  return {
    items: items.map((member) => toMember(member, null)),
    pagination: buildPagination(query.page, take, total),
  };
}

export async function addMember(
  actor: PermissionActor,
  departmentId: number,
  input: AddMemberInput,
) {
  const department = await requireDepartment(
    actor,
    departmentId,
    "department.members.manage",
  );
  await requirePosition(input.positionId);

  const user = await memberRepository.findUserByEmail(input.email);
  if (!user) throw new AppError(404, "Không tìm thấy người dùng với email này");
  if (user.status !== Status.ACTIVE) {
    throw new AppError(400, "Tài khoản này chưa được kích hoạt");
  }
  if (user.role !== Role.EMPLOYEE) {
    throw new AppError(400, "Chỉ có thể thêm nhân viên vào phòng ban");
  }
  if (user.departmentId === department.id) {
    throw new AppError(409, "Người dùng đã thuộc phòng ban này");
  }
  // Chuyển người giữa các phòng do Giám đốc làm qua transferMember.
  if (user.departmentId !== null) {
    throw new AppError(409, "Người dùng đang thuộc phòng ban khác");
  }

  const member = await memberRepository.assignUserToDepartment(
    user.id,
    department.id,
    input.positionId,
  );
  return toMember(member, department.managerId);
}

export async function updateMember(
  actor: PermissionActor,
  departmentId: number,
  userId: number,
  input: UpdateMemberInput,
) {
  const department = await requireDepartment(
    actor,
    departmentId,
    "department.members.manage",
  );
  await requireMember(department.id, userId);
  if (userId === department.managerId) {
    throw new AppError(
      400,
      "Chức danh trưởng phòng do Giám đốc quản lý khi bổ nhiệm/miễn nhiệm",
    );
  }
  await requirePosition(input.positionId);

  const member = await memberRepository.updateMemberPosition(
    userId,
    input.positionId,
  );
  return toMember(member, department.managerId);
}

export async function removeMember(
  actor: PermissionActor,
  departmentId: number,
  userId: number,
) {
  const department = await requireDepartment(
    actor,
    departmentId,
    "department.members.manage",
  );
  if (userId === department.managerId) {
    throw new AppError(400, "Không thể xóa trưởng phòng khỏi phòng ban");
  }
  await requireMember(department.id, userId);
  await memberRepository.removeUserFromDepartment(userId);
}

/** Giám đốc chuyển nhân viên sang phòng khác. Trưởng phòng phải được miễn nhiệm trước. */
export async function transferMember(
  actor: PermissionActor,
  departmentId: number,
  userId: number,
  input: TransferMemberInput,
) {
  const source = await requireDepartment(
    actor,
    departmentId,
    "department.members.transfer",
  );
  if (input.toDepartmentId === source.id) {
    throw new AppError(400, "Phòng ban đích trùng phòng ban hiện tại");
  }
  await requireMember(source.id, userId);
  if (userId === source.managerId) {
    throw new AppError(
      400,
      "Hãy miễn nhiệm trưởng phòng trước khi chuyển sang phòng khác",
    );
  }

  const target = await memberRepository.findDepartmentById(
    input.toDepartmentId,
  );
  if (!target) throw new AppError(404, "Phòng ban đích không tồn tại");

  const member = await memberRepository.assignUserToDepartment(
    userId,
    target.id,
    undefined,
  );
  return toMember(member, target.managerId);
}
