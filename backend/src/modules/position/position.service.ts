import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";

export async function getAllPositions() {
  const positions = await prisma.position.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { level: "asc" },
  });
  return positions;
}
