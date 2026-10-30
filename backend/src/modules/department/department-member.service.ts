import { Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
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

async function requireDepartment(managerId: number) {
  const department = await memberRepository.findManagedDepartment(managerId);
  if (!department) {
    throw new AppError(404, "Bạn chưa quản lý phòng ban nào");
  }
  return department;
}

async function requireMember(departmentId: number, userId: number) {
  const member = await memberRepository.findMemberInDepartment(
    departmentId,
    userId,
  );
  if (!member) {
    throw new AppError(404, "Nhân viên không thuộc phòng ban của bạn");
  }
  return member;
}

async function requirePosition(positionId: number | null | undefined) {
  if (!positionId) return;
  const position = await memberRepository.findPositionById(positionId);
  if (!position) throw new AppError(404, "Chức vụ không tồn tại");
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

export async function listMembers(managerId: number, query: MemberListQuery) {
  const department = await requireDepartment(managerId);
  const members = await memberRepository.findMembers(
    department.id,
    query.search,
  );
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
  managerId: number,
  userId: number,
  query: MemberTaskListQuery,
) {
  const department = await requireDepartment(managerId);
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

export async function listProjects(managerId: number) {
  const department = await requireDepartment(managerId);
  const members = await memberRepository.findMembers(department.id);
  if (members.length === 0) return [];

  return memberRepository.findDepartmentProjects(
    members.map((member) => member.id),
  );
}

export async function listCandidates(
  managerId: number,
  query: CandidateListQuery,
) {
  await requireDepartment(managerId);

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

export async function addMember(managerId: number, input: AddMemberInput) {
  const department = await requireDepartment(managerId);
  await requirePosition(input.positionId);

  const user = await memberRepository.findUserByEmail(input.email);
  if (!user) throw new AppError(404, "Không tìm thấy người dùng với email này");
  if (user.status !== Status.ACTIVE) {
    throw new AppError(400, "Tài khoản này chưa được kích hoạt");
  }
  if (user.departmentId === department.id) {
    throw new AppError(409, "Người dùng đã thuộc phòng ban của bạn");
  }
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
  managerId: number,
  userId: number,
  input: UpdateMemberInput,
) {
  const department = await requireDepartment(managerId);
  await requireMember(department.id, userId);
  await requirePosition(input.positionId);

  const member = await memberRepository.updateMemberPosition(
    userId,
    input.positionId,
  );
  return toMember(member, department.managerId);
}

export async function removeMember(managerId: number, userId: number) {
  const department = await requireDepartment(managerId);
  if (userId === department.managerId) {
    throw new AppError(400, "Không thể xóa trưởng phòng khỏi phòng ban");
  }
  await requireMember(department.id, userId);
  await memberRepository.removeUserFromDepartment(userId);
}
