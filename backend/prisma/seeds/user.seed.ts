import { PrismaClient, Role, Status } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
  console.log("--- Seeding Users & Profiles ---");

  const itDept = await prisma.department.findFirst({
    where: { name: { contains: "Công nghệ" } },
  });
  const managerPos = await prisma.position.findFirst({
    where: { name: "Trưởng phòng" },
  });
  const staffPos = await prisma.position.findFirst({
    where: { name: "Nhân viên" },
  });

  const hashPassword = await bcrypt.hash("123456", 10);

  const users = [
    {
      email: "admin@company.com",
      fullName: "Hệ thống Admin",
      role: Role.ADMIN,
      password: hashPassword,
      profile: {
        create: {
          bio: "Tài khoản quản trị hệ thống",
          phone: "0123456789",
          gender: "Nam",
        },
      },
    },
    {
      email: "manager.it@company.com",
      fullName: "Nguyễn Văn Quản Lý",
      role: Role.MANAGER,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: managerPos?.id,
      profile: {
        create: {
          bio: "Trưởng phòng IT với 10 năm kinh nghiệm",
          phone: "0987654321",
          gender: "Nam",
        },
      },
    },
    {
      email: "employee1@company.com",
      fullName: "Trần Thị Nhân Viên",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: staffPos?.id,
      profile: {
        create: {
          bio: "Nhân viên phát triển Fullstack",
          gender: "Nữ",
        },
      },
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  // Cập nhật Manager cho phòng IT sau khi đã tạo User
  if (itDept) {
    const manager = await prisma.user.findUnique({
      where: { email: "manager.it@company.com" },
    });
    if (manager) {
      await prisma.department.update({
        where: { id: itDept.id },
        data: { managerId: manager.id },
      });
    }
  }
}
