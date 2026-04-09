import prisma from "../utils/prisma";

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

export async function getAllPositions() {
  return prisma.position.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { level: "asc" },
  });
}
