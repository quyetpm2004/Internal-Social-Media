import { Role } from "@prisma/client";
import prisma from "../src/utils/prisma";
import bcrypt from "bcrypt";

async function main() {
  console.log("Đang bắt đầu quá trình seeding...");

  // 1. Xóa dữ liệu cũ (Theo thứ tự ràng buộc)
  await prisma.refreshToken.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.updateMany({
    data: { departmentId: null, positionId: null },
  });
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();

  console.log("Đã làm sạch dữ liệu cũ.");

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 2. Tạo Positions
  const positions = await Promise.all([
    prisma.position.create({ data: { name: "Giám đốc", level: 5 } }),
    prisma.position.create({ data: { name: "Trưởng phòng", level: 4 } }),
    prisma.position.create({ data: { name: "Chuyên viên cao cấp", level: 3 } }),
    prisma.position.create({ data: { name: "Nhân viên", level: 2 } }),
    prisma.position.create({ data: { name: "Thực tập sinh", level: 1 } }),
  ]);
  const [directorPos, managerPos, seniorPos, staffPos, internPos] = positions;

  // 3. Tạo Admin kèm Profile
  await prisma.user.create({
    data: {
      fullName: "Hệ thống Admin",
      email: "admin@company.com",
      password: hashedPassword,
      role: Role.ADMIN,
      positionId: directorPos.id,
      profile: {
        create: {
          bio: "Quản trị viên cấp cao của hệ thống",
          phone: "0901234567",
          address: "Tòa nhà Landmark 81, TP. HCM",
          gender: "Nam",
          birthdate: new Date("1990-01-01"),
        },
      },
    },
  });

  // 4. Tạo các Phòng ban
  const itDept = await prisma.department.create({
    data: { name: "Phòng Kỹ thuật", description: "Phát triển phần mềm" },
  });

  // 5. Tạo IT Manager kèm Profile
  const itManager = await prisma.user.create({
    data: {
      fullName: "Nguyễn Văn Quản Lý",
      email: "it.manager@company.com",
      password: hashedPassword,
      role: Role.MANAGER,
      departmentId: itDept.id,
      positionId: managerPos.id,
      profile: {
        create: {
          bio: "Chuyên gia giải pháp phần mềm với 10 năm kinh nghiệm",
          phone: "0912345678",
          address: "Quận 1, TP. HCM",
          gender: "Nam",
          birthdate: new Date("1985-05-20"),
        },
      },
    },
  });

  await prisma.department.update({
    where: { id: itDept.id },
    data: { managerId: itManager.id },
  });

  // 6. Tạo Nhân viên mẫu bằng vòng lặp (để hỗ trợ nested create profile)
  const employeesData = [
    {
      fullName: "Trần Thị Dev",
      email: "dev1@company.com",
      bio: "Yêu thích lập trình React và NestJS",
      phone: "0922334455",
      posId: seniorPos.id,
      deptId: itDept.id,
    },
    {
      fullName: "Lê Văn Thực Tập",
      email: "intern@company.com",
      bio: "Sinh viên năm cuối mong muốn học hỏi",
      phone: "0988776655",
      posId: internPos.id,
      deptId: itDept.id,
    },
  ];

  for (const emp of employeesData) {
    await prisma.user.create({
      data: {
        fullName: emp.fullName,
        email: emp.email,
        password: hashedPassword,
        role: Role.EMPLOYEE,
        departmentId: emp.deptId,
        positionId: emp.posId,
        profile: {
          create: {
            bio: emp.bio,
            phone: emp.phone,
            gender: "Nữ",
            birthdate: new Date("1998-10-10"),
          },
        },
      },
    });
  }

  console.log("Seeding hoàn tất thành công kèm Profile!");
}

main()
  .catch((e) => {
    console.error("Lỗi khi seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
