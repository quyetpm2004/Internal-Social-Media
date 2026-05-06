import { PrismaClient } from "@prisma/client";

export async function seedPositions(prisma: PrismaClient) {
  console.log("--- Seeding Positions ---");

  const positions = [
    { name: "Giám đốc", level: 1 },
    { name: "Trưởng phòng", level: 2 },
    { name: "Chuyên viên cao cấp", level: 3 },
    { name: "Nhân viên", level: 4 },
    { name: "Thực tập sinh", level: 5 },
  ];

  for (const pos of positions) {
    // Vì Position không có field unique ngoài ID,
    // chúng ta check theo name để tránh duplicate khi seed lại
    const existing = await prisma.position.findFirst({
      where: { name: pos.name },
    });
    if (!existing) {
      await prisma.position.create({ data: pos });
    }
  }
}
