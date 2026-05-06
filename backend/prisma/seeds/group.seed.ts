import { PrismaClient, GroupType, GroupMemberRole } from "@prisma/client";

export async function seedGroups(prisma: PrismaClient) {
  console.log("--- Seeding Groups ---");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const staff = await prisma.user.findUnique({
    where: { email: "employee1@company.com" },
  });

  if (!admin || !staff) return;

  const group = await prisma.group.create({
    data: {
      groupName: "Cộng đồng lập trình viên",
      description: "Nơi chia sẻ kiến thức về React, Nodejs và Prisma",
      groupType: GroupType.PUBLIC,
      createdBy: admin.id,
      members: {
        create: [
          { userId: admin.id, memberRole: GroupMemberRole.ADMIN },
          { userId: staff.id, memberRole: GroupMemberRole.MEMBER },
        ],
      },
    },
  });
}
