import prisma from "@/shared/utils/prisma";

const departmentSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const findAllDepartments = () =>
  prisma.department.findMany({
    select: departmentSelect,
    orderBy: { name: "asc" },
  });
