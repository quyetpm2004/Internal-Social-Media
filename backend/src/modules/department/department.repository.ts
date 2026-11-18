import { Role, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getPositionIdByKey } from "@/modules/position/position.repository";
import prisma from "@/shared/utils/prisma";

const departmentSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  manager: { select: { id: true, fullName: true, email: true } },
  _count: { select: { users: true } },
} as const;

export const findAllDepartments = () =>
  prisma.department.findMany({
    select: departmentSelect,
    orderBy: { name: "asc" },
  });

export const findDepartmentById = (id: number) =>
  prisma.department.findUnique({ where: { id }, select: departmentSelect });

export const findDepartmentByName = (name: string) =>
  prisma.department.findUnique({ where: { name }, select: { id: true } });

export const createDepartment = (data: {
  name: string;
  description?: string | null;
}) =>
  prisma.department.create({
    data: { name: data.name, description: data.description ?? null },
    select: departmentSelect,
  });

export const updateDepartment = (
  id: number,
  data: { name?: string; description?: string | null },
) =>
  prisma.department.update({
    where: { id },
    data,
    select: departmentSelect,
  });

export const countDepartmentUsage = async (id: number) => {
  const [members, tasks] = await Promise.all([
    prisma.user.count({ where: { departmentId: id } }),
    prisma.task.count({ where: { departmentId: id } }),
  ]);
  return { members, tasks };
};

/** Xóa phòng rỗng: workflow phòng ban (FK Restrict) phải xóa trước, trạng thái đi kèm xóa theo. */
export const deleteEmptyDepartment = (id: number) =>
  prisma.$transaction(async (tx) => {
    await tx.workflow.deleteMany({ where: { departmentId: id } });
    await tx.department.delete({ where: { id } });
  });

export const findUserForAppointment = (userId: number) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      role: true,
      status: true,
      departmentId: true,
    },
  });

export const findAppointees = (
  search: string | undefined,
  skip: number,
  take: number,
) => {
  const where = {
    role: Role.EMPLOYEE,
    status: Status.ACTIVE,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  return Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        profile: { select: { avatarKey: true } },
      },
      orderBy: { fullName: "asc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);
};

/**
 * Bổ nhiệm Trưởng phòng:
 * gán managerId + nâng role MANAGER + chức danh MANAGER + chuyển sang phòng này,
 * rồi thu hồi phiên của người đó để role mới có hiệu lực ngay.
 */
export const appointManager = (departmentId: number, userId: number) =>
  prisma.$transaction(async (tx) => {
    // Chặn race: chỉ gán được khi phòng vẫn chưa có trưởng phòng.
    const claimed = await tx.department.updateMany({
      where: { id: departmentId, managerId: null },
      data: { managerId: userId },
    });
    if (claimed.count === 0) {
      throw new AppError(409, "Phòng ban đã có trưởng phòng");
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        role: Role.MANAGER,
        departmentId,
        positionId: await getPositionIdByKey("MANAGER", tx),
        tokenVersion: { increment: 1 },
      },
    });
    await tx.refreshToken.deleteMany({ where: { userId } });
  });

/**
 * Miễn nhiệm Trưởng phòng:
 * gỡ managerId + hạ role EMPLOYEE + chức danh nhân viên, người đó vẫn ở lại phòng.
 */
export const dismissManager = (departmentId: number, managerId: number) =>
  prisma.$transaction(async (tx) => {
    const released = await tx.department.updateMany({
      where: { id: departmentId, managerId },
      data: { managerId: null },
    });
    if (released.count === 0) {
      throw new AppError(409, "Trưởng phòng đã thay đổi, vui lòng tải lại");
    }

    await tx.user.update({
      where: { id: managerId },
      data: {
        role: Role.EMPLOYEE,
        positionId: await getPositionIdByKey("STAFF", tx),
        tokenVersion: { increment: 1 },
      },
    });
    await tx.refreshToken.deleteMany({ where: { userId: managerId } });
  });
