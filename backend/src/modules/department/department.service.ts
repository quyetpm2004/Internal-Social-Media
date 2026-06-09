import prisma from "@/shared/utils/prisma";

export async function getAllDepartments() {
  return prisma.department.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });
}
