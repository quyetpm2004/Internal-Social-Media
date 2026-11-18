import { Role, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { buildPagination, paginate } from "@/shared/utils/pagination";
import type {
  AppointManagerInput,
  AppointeeListQuery,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@/modules/department/department.schema";
import * as departmentRepo from "@/modules/department/department.repository";

export async function getAllDepartments() {
  return departmentRepo.findAllDepartments();
}

async function requireDepartment(departmentId: number) {
  const department = await departmentRepo.findDepartmentById(departmentId);
  if (!department) throw new AppError(404, "Phòng ban không tồn tại");
  return department;
}

async function assertNameAvailable(name: string, exceptId?: number) {
  const existing = await departmentRepo.findDepartmentByName(name);
  if (existing && existing.id !== exceptId) {
    throw new AppError(409, "Tên phòng ban đã tồn tại");
  }
}

export async function createDepartment(input: CreateDepartmentInput) {
  await assertNameAvailable(input.name);
  return departmentRepo.createDepartment(input);
}

export async function updateDepartment(
  departmentId: number,
  input: UpdateDepartmentInput,
) {
  await requireDepartment(departmentId);
  if (input.name !== undefined) {
    await assertNameAvailable(input.name, departmentId);
  }
  return departmentRepo.updateDepartment(departmentId, input);
}

export async function deleteDepartment(departmentId: number) {
  await requireDepartment(departmentId);

  const usage = await departmentRepo.countDepartmentUsage(departmentId);
  if (usage.members > 0) {
    throw new AppError(
      409,
      "Phòng ban còn nhân sự, hãy chuyển hoặc gỡ nhân sự trước khi xóa",
    );
  }
  if (usage.tasks > 0) {
    throw new AppError(409, "Phòng ban còn công việc, không thể xóa");
  }

  await departmentRepo.deleteEmptyDepartment(departmentId);
}

export async function listAppointees(query: AppointeeListQuery) {
  const { skip, take } = paginate(query.page, query.limit);
  const [items, total] = await departmentRepo.findAppointees(
    query.search,
    skip,
    take,
  );

  return {
    items: items.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      department: user.department,
      position: user.position,
      avatarKey: user.profile?.avatarKey ?? null,
    })),
    pagination: buildPagination(query.page, take, total),
  };
}

export async function appointManager(
  departmentId: number,
  input: AppointManagerInput,
) {
  const department = await requireDepartment(departmentId);
  if (department.manager) {
    throw new AppError(
      409,
      "Phòng ban đã có trưởng phòng, hãy miễn nhiệm trước khi bổ nhiệm người khác",
    );
  }

  const user = await departmentRepo.findUserForAppointment(input.userId);
  if (!user) throw new AppError(404, "Không tìm thấy người dùng");
  if (user.status !== Status.ACTIVE) {
    throw new AppError(400, "Tài khoản này chưa được kích hoạt");
  }
  // Chỉ Employee mới được bổ nhiệm: Manager đang quản lý phòng khác phải được miễn nhiệm trước.
  if (user.role !== Role.EMPLOYEE) {
    throw new AppError(400, "Chỉ có thể bổ nhiệm nhân viên làm trưởng phòng");
  }

  await departmentRepo.appointManager(department.id, user.id);
  return requireDepartment(department.id);
}

export async function dismissManager(departmentId: number) {
  const department = await requireDepartment(departmentId);
  if (!department.manager) {
    throw new AppError(409, "Phòng ban chưa có trưởng phòng");
  }

  await departmentRepo.dismissManager(department.id, department.manager.id);
  return requireDepartment(department.id);
}
