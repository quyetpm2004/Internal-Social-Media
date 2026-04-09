import prisma from "../utils/prisma";

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
