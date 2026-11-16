import { PrismaClient } from "@prisma/client";

export const POSITION_KEYS = [
  "DIRECTOR",
  "MANAGER",
  "SENIOR",
  "STAFF",
  "INTERN",
] as const;
export type PositionKey = (typeof POSITION_KEYS)[number];

const POSITIONS: { key: PositionKey; name: string; level: number }[] = [
  { key: "DIRECTOR", name: "Giám đốc", level: 1 },
  { key: "MANAGER", name: "Trưởng phòng", level: 2 },
  { key: "SENIOR", name: "Chuyên viên cao cấp", level: 3 },
  { key: "STAFF", name: "Nhân viên", level: 4 },
  { key: "INTERN", name: "Thực tập sinh", level: 5 },
];

export async function seedPositions(prisma: PrismaClient) {
  console.log("--- Seeding Positions ---");

  for (const { key, name, level } of POSITIONS) {
    await prisma.position.upsert({
      where: { key },
      update: { name, level },
      create: { key, name, level },
    });
  }
}

/** Tra chức danh theo key; báo lỗi rõ ràng nếu thiếu thay vì trả về undefined. */
export async function getPositionIdsByKey(
  prisma: PrismaClient,
): Promise<Record<PositionKey, number>> {
  const rows = await prisma.position.findMany({
    where: { key: { in: [...POSITION_KEYS] } },
    select: { id: true, key: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.id]));
  const result = {} as Record<PositionKey, number>;
  for (const key of POSITION_KEYS) {
    const id = byKey.get(key);
    if (id === undefined) {
      throw new Error(`Không tìm thấy chức danh với key "${key}". Hãy chạy seedPositions trước.`);
    }
    result[key] = id;
  }
  return result;
}
