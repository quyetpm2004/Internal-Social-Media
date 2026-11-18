import { Prisma } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
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

export type SystemPositionKey = "DIRECTOR" | "MANAGER" | "STAFF";

/** Chức danh gắn với role, chỉ đổi tự động qua bổ nhiệm/miễn nhiệm và cấp role. */
export const ROLE_BOUND_POSITION_KEYS: readonly string[] = [
  "DIRECTOR",
  "MANAGER",
];

/**
 * Tra chức danh theo key và báo lỗi rõ ràng nếu thiếu
 * (không để undefined lọt vào dữ liệu như khi tra theo tên).
 */
export async function getPositionIdByKey(
  key: SystemPositionKey,
  client: Prisma.TransactionClient = prisma,
): Promise<number> {
  const position = await client.position.findUnique({
    where: { key },
    select: { id: true },
  });
  if (!position) {
    throw new AppError(
      500,
      `Thiếu chức danh hệ thống "${key}". Hãy chạy seed chức danh.`,
    );
  }
  return position.id;
}
