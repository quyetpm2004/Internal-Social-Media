import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
  console.log("--- Seeding Users & Profiles ---");

  const [itDept, hrDept, mktDept, boardDept] = await Promise.all([
    prisma.department.findFirst({ where: { name: { contains: "Công nghệ" } } }),
    prisma.department.findFirst({ where: { name: { contains: "Nhân sự" } } }),
    prisma.department.findFirst({ where: { name: { contains: "Marketing" } } }),
    prisma.department.findFirst({ where: { name: { contains: "Giám đốc" } } }),
  ]);

  const [directorPos, managerPos, seniorPos, staffPos, internPos] =
    await Promise.all([
      prisma.position.findFirst({ where: { name: "Giám đốc" } }),
      prisma.position.findFirst({ where: { name: "Trưởng phòng" } }),
      prisma.position.findFirst({ where: { name: "Chuyên viên cao cấp" } }),
      prisma.position.findFirst({ where: { name: "Nhân viên" } }),
      prisma.position.findFirst({ where: { name: "Thực tập sinh" } }),
    ]);

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
      email: "director@company.com",
      fullName: "Phạm Văn Giám Đốc",
      role: Role.MANAGER,
      password: hashPassword,
      departmentId: boardDept?.id,
      positionId: directorPos?.id,
      profile: {
        create: { bio: "Giám đốc điều hành", phone: "0901000001", gender: "Nam" },
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
      email: "manager.hr@company.com",
      fullName: "Lê Thị Nhân Sự",
      role: Role.MANAGER,
      password: hashPassword,
      departmentId: hrDept?.id,
      positionId: managerPos?.id,
      profile: {
        create: { bio: "Trưởng phòng Nhân sự", phone: "0902000002", gender: "Nữ" },
      },
    },
    {
      email: "manager.mkt@company.com",
      fullName: "Hoàng Văn Marketing",
      role: Role.MANAGER,
      password: hashPassword,
      departmentId: mktDept?.id,
      positionId: managerPos?.id,
      profile: {
        create: { bio: "Trưởng phòng Marketing", phone: "0903000003", gender: "Nam" },
      },
    },
    {
      email: "employee1@company.com",
      fullName: "Trần Thị Nhân Viên",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Fullstack Developer", gender: "Nữ" } },
    },
    {
      email: "employee2@company.com",
      fullName: "Nguyễn Văn Backend",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Backend Node.js", gender: "Nam" } },
    },
    {
      email: "employee3@company.com",
      fullName: "Phạm Thị Frontend",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "React & TypeScript", gender: "Nữ" } },
    },
    {
      email: "employee4@company.com",
      fullName: "Võ Văn DevOps",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: seniorPos?.id,
      profile: { create: { bio: "CI/CD & Cloud", gender: "Nam" } },
    },
    {
      email: "employee5@company.com",
      fullName: "Đặng Thị QA",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Kiểm thử phần mềm", gender: "Nữ" } },
    },
    {
      email: "employee6@company.com",
      fullName: "Bùi Văn Mobile",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: itDept?.id,
      positionId: internPos?.id,
      profile: { create: { bio: "Flutter intern", gender: "Nam" } },
    },
    {
      email: "employee7@company.com",
      fullName: "Trịnh Thị HR",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: hrDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Tuyển dụng & onboarding", gender: "Nữ" } },
    },
    {
      email: "employee8@company.com",
      fullName: "Lý Văn Đào Tạo",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: hrDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Đào tạo nội bộ", gender: "Nam" } },
    },
    {
      email: "employee9@company.com",
      fullName: "Mai Thị C&B",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: hrDept?.id,
      positionId: seniorPos?.id,
      profile: { create: { bio: "Chính sách lương thưởng", gender: "Nữ" } },
    },
    {
      email: "employee10@company.com",
      fullName: "Đinh Văn Content",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: mktDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Content marketing", gender: "Nam" } },
    },
    {
      email: "employee11@company.com",
      fullName: "Hồ Thị Social",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: mktDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Social media", gender: "Nữ" } },
    },
    {
      email: "employee12@company.com",
      fullName: "Châu Văn Brand",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: mktDept?.id,
      positionId: seniorPos?.id,
      profile: { create: { bio: "Thương hiệu doanh nghiệp", gender: "Nam" } },
    },
    {
      email: "employee13@company.com",
      fullName: "Vương Thị Designer",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: mktDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Thiết kế đồ họa", gender: "Nữ" } },
    },
    {
      email: "employee14@company.com",
      fullName: "Tạ Văn Kế Toán",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: boardDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Kế toán tổng hợp", gender: "Nam" } },
    },
    {
      email: "employee15@company.com",
      fullName: "Phan Thị Hành Chính",
      role: Role.EMPLOYEE,
      password: hashPassword,
      departmentId: boardDept?.id,
      positionId: staffPos?.id,
      profile: { create: { bio: "Hành chính văn phòng", gender: "Nữ" } },
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  const managerAssignments: { deptName: string; email: string }[] = [
    { deptName: "Công nghệ", email: "manager.it@company.com" },
    { deptName: "Nhân sự", email: "manager.hr@company.com" },
    { deptName: "Marketing", email: "manager.mkt@company.com" },
  ];

  for (const { deptName, email } of managerAssignments) {
    const dept = await prisma.department.findFirst({
      where: { name: { contains: deptName } },
    });
    const manager = await prisma.user.findUnique({ where: { email } });
    if (dept && manager) {
      await prisma.department.update({
        where: { id: dept.id },
        data: { managerId: manager.id },
      });
    }
  }

  console.log(`✅ Seeded ${users.length} users.`);
}
