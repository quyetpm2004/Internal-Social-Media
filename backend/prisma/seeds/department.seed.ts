import { PrismaClient } from "@prisma/client";

export async function seedDepartments(prisma: PrismaClient) {
  console.log("--- Seeding Departments ---");

  const departments = [
    {
      name: "Phòng Công nghệ thông tin",
      description: "Quản trị hệ thống và phát triển phần mềm",
    },
    { name: "Phòng Nhân sự", description: "Tuyển dụng và đào tạo" },
    {
      name: "Phòng Marketing",
      description: "Truyền thông và quảng bá thương hiệu",
    },
    { name: "Ban Giám đốc", description: "Quản lý cấp cao" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
}
