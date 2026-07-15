import prisma from "@/shared/utils/prisma";

const positionSelect = {
  id: true,
  name: true,
  level: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const findAllPositions = () =>
  prisma.position.findMany({
    select: positionSelect,
    orderBy: { level: "asc" },
  });
