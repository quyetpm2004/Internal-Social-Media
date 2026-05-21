import {
  PrismaClient,
  GroupType,
  GroupMemberRole,
  GroupMemberStatus,
} from "@prisma/client";

const GROUP_SEED_MARKER = "seed-group-v2";

export async function seedGroups(prisma: PrismaClient) {
  console.log("--- Seeding Groups ---");

  const existing = await prisma.group.count({
    where: { description: { contains: GROUP_SEED_MARKER } },
  });
  if (existing >= 10) {
    console.log("⏭️  Groups already seeded, skipping.");
    return;
  }

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true, departmentId: true },
  });
  if (users.length < 5) {
    console.log("❌ Not enough users for groups. Skipping.");
    return;
  }

  const byEmail = (email: string) => users.find((u) => u.email === email)?.id;
  const adminId = byEmail("admin@company.com") ?? users[0].id;
  const itManagerId = byEmail("manager.it@company.com") ?? adminId;
  const hrManagerId = byEmail("manager.hr@company.com") ?? adminId;
  const mktManagerId = byEmail("manager.mkt@company.com") ?? adminId;
  const directorId = byEmail("director@company.com") ?? adminId;

  const [itDept, hrDept, mktDept] = await Promise.all([
    prisma.department.findFirst({ where: { name: { contains: "Công nghệ" } } }),
    prisma.department.findFirst({ where: { name: { contains: "Nhân sự" } } }),
    prisma.department.findFirst({ where: { name: { contains: "Marketing" } } }),
  ]);

  const employeeIds = users
    .filter((u) => u.email.startsWith("employee"))
    .map((u) => u.id);

  const pickMembers = (ids: number[], min = 4, max = 7) => {
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    const count = min + Math.floor(Math.random() * (max - min + 1));
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  type GroupSeed = {
    groupName: string;
    description: string;
    groupType: GroupType;
    createdBy: number;
    departmentId?: number;
    adminId: number;
    memberIds: number[];
  };

  const groups: GroupSeed[] = [
    {
      groupName: "Cộng đồng lập trình viên",
      description: `${GROUP_SEED_MARKER} | Chia sẻ React, Node.js, Prisma`,
      groupType: GroupType.PUBLIC,
      createdBy: adminId,
      adminId: itManagerId,
      memberIds: pickMembers(employeeIds),
    },
    {
      groupName: "Kinh nghiệm làm việc & mentor",
      description: `${GROUP_SEED_MARKER} | Góc chia sẻ nghề nghiệp`,
      groupType: GroupType.PUBLIC,
      createdBy: hrManagerId,
      adminId: hrManagerId,
      memberIds: pickMembers(employeeIds),
    },
    {
      groupName: "Dự án Alpha (nội bộ)",
      description: `${GROUP_SEED_MARKER} | Nhóm riêng dự án sản phẩm mới`,
      groupType: GroupType.PRIVATE,
      createdBy: itManagerId,
      adminId: itManagerId,
      memberIds: pickMembers(
        employeeIds.filter((id) => {
          const u = users.find((x) => x.id === id);
          return u?.departmentId === itDept?.id;
        }),
        3,
        5,
      ),
    },
    {
      groupName: "HR - Chính sách & phúc lợi",
      description: `${GROUP_SEED_MARKER} | Trao đổi nội bộ phòng Nhân sự`,
      groupType: GroupType.PRIVATE,
      createdBy: hrManagerId,
      adminId: hrManagerId,
      memberIds: pickMembers(
        employeeIds.filter((id) => {
          const u = users.find((x) => x.id === id);
          return u?.departmentId === hrDept?.id;
        }),
        3,
        4,
      ),
    },
    {
      groupName: "Phòng IT - Thông báo",
      description: `${GROUP_SEED_MARKER} | Nhóm theo phòng ban CNTT`,
      groupType: GroupType.DEPARTMENT,
      createdBy: itManagerId,
      departmentId: itDept?.id,
      adminId: itManagerId,
      memberIds: pickMembers(
        employeeIds.filter((id) => {
          const u = users.find((x) => x.id === id);
          return u?.departmentId === itDept?.id;
        }),
      ),
    },
    {
      groupName: "Phòng Marketing - Chiến dịch",
      description: `${GROUP_SEED_MARKER} | Kế hoạch truyền thông & branding`,
      groupType: GroupType.DEPARTMENT,
      createdBy: mktManagerId,
      departmentId: mktDept?.id,
      adminId: mktManagerId,
      memberIds: pickMembers(
        employeeIds.filter((id) => {
          const u = users.find((x) => x.id === id);
          return u?.departmentId === mktDept?.id;
        }),
      ),
    },
    {
      groupName: "Sự kiện & team building",
      description: `${GROUP_SEED_MARKER} | Lịch hoạt động công ty`,
      groupType: GroupType.PUBLIC,
      createdBy: adminId,
      adminId: adminId,
      memberIds: pickMembers(employeeIds, 6, 10),
    },
    {
      groupName: "Thể thao cuối tuần",
      description: `${GROUP_SEED_MARKER} | Bóng đá, cầu lông, chạy bộ`,
      groupType: GroupType.PUBLIC,
      createdBy: employeeIds[0] ?? adminId,
      adminId: employeeIds[0] ?? adminId,
      memberIds: pickMembers(employeeIds, 5, 8),
    },
    {
      groupName: "Ban lãnh đạo",
      description: `${GROUP_SEED_MARKER} | Trao đổi chiến lược (riêng tư)`,
      groupType: GroupType.PRIVATE,
      createdBy: directorId,
      adminId: directorId,
      memberIds: [itManagerId, hrManagerId, mktManagerId, adminId].filter(
        (id, i, arr) => arr.indexOf(id) === i,
      ),
    },
    {
      groupName: "Đào tạo & upskill",
      description: `${GROUP_SEED_MARKER} | Khóa học nội bộ, workshop`,
      groupType: GroupType.PUBLIC,
      createdBy: hrManagerId,
      adminId: hrManagerId,
      memberIds: pickMembers(employeeIds, 5, 9),
    },
  ];

  for (const g of groups) {
    const memberUserIds = new Set([g.adminId, g.createdBy, ...g.memberIds]);

    await prisma.group.create({
      data: {
        groupName: g.groupName,
        description: g.description,
        groupType: g.groupType,
        createdBy: g.createdBy,
        departmentId: g.departmentId,
        members: {
          create: [...memberUserIds].map((userId) => ({
            userId,
            memberRole:
              userId === g.adminId
                ? GroupMemberRole.ADMIN
                : userId === g.createdBy && userId !== g.adminId
                  ? GroupMemberRole.MODERATOR
                  : GroupMemberRole.MEMBER,
            status: GroupMemberStatus.ACTIVE,
          })),
        },
      },
    });
  }

  console.log(`✅ Seeded ${groups.length} groups.`);
}
