import {
  PrismaClient,
  ConversationType,
  ConversationMemberRole,
  MessageContentType,
  MessageStatus,
  AttachmentType,
  MediaStatus,
} from "@prisma/client";

const CHAT_SEED_MARKER = "seed-chat-v1";

type AttachmentSeed = {
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  attachmentType: AttachmentType;
};

type MessageSeed = {
  from: number;
  content: string;
  offsetMinutes: number;
  contentType?: MessageContentType;
  attachments?: AttachmentSeed[];
};

const IMG_TEAM: AttachmentSeed = {
  fileName: "team-photo.png",
  fileKey: "chat/seed/team-photo.png",
  mimeType: "image/png",
  fileSize: 245_678,
  attachmentType: AttachmentType.IMAGE,
};

const IMG_DESIGN: AttachmentSeed = {
  fileName: "design-mockup.jpg",
  fileKey: "chat/seed/design-mockup.jpg",
  mimeType: "image/jpeg",
  fileSize: 512_345,
  attachmentType: AttachmentType.IMAGE,
};

const IMG_CHART: AttachmentSeed = {
  fileName: "kpi-chart.png",
  fileKey: "chat/seed/kpi-chart.png",
  mimeType: "image/png",
  fileSize: 178_900,
  attachmentType: AttachmentType.IMAGE,
};

const VID_DEMO: AttachmentSeed = {
  fileName: "feature-demo.mp4",
  fileKey: "chat/seed/feature-demo.mp4",
  mimeType: "video/mp4",
  fileSize: 5_242_880,
  attachmentType: AttachmentType.VIDEO,
};

const FILE_BUDGET: AttachmentSeed = {
  fileName: "budget-2026-q1.pdf",
  fileKey: "chat/seed/budget-2026-q1.pdf",
  mimeType: "application/pdf",
  fileSize: 1_048_576,
  attachmentType: AttachmentType.FILE,
};

const FILE_REPORT: AttachmentSeed = {
  fileName: "quarterly-report.xlsx",
  fileKey: "chat/seed/quarterly-report.xlsx",
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  fileSize: 524_288,
  attachmentType: AttachmentType.FILE,
};

const FILE_DOC: AttachmentSeed = {
  fileName: "meeting-notes.docx",
  fileKey: "chat/seed/meeting-notes.docx",
  mimeType:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  fileSize: 78_900,
  attachmentType: AttachmentType.FILE,
};

const MINUTE = 60 * 1000;
const baseTime = () => Date.now() - 2 * 24 * 60 * MINUTE; // 2 ngày trước

async function createConversationWithMessages(
  prisma: PrismaClient,
  options: {
    type: ConversationType;
    name?: string;
    createdById: number;
    members: { userId: number; role: ConversationMemberRole }[];
    messages: MessageSeed[];
    unreadForUserId?: number;
  },
) {
  const start = baseTime();

  const conversation = await prisma.conversation.create({
    data: {
      type: options.type,
      name: options.name ?? null,
      createdById: options.createdById,
      members: {
        create: options.members.map((m) => ({
          userId: m.userId,
          role: m.role,
        })),
      },
    },
  });

  let lastMessageAt: Date | null = null;

  for (const msg of options.messages) {
    const createdAt = new Date(start + msg.offsetMinutes * MINUTE);
    lastMessageAt = createdAt;

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: msg.from,
        contentType: msg.contentType ?? MessageContentType.TEXT,
        content: msg.content,
        status: MessageStatus.ACTIVE,
        createdAt,
        updatedAt: createdAt,
      },
    });

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            fileName: att.fileName,
            fileKey: att.fileKey,
            mimeType: att.mimeType,
            fileSize: att.fileSize,
            attachmentType: att.attachmentType,
            status: MediaStatus.ACTIVE,
            uploadedById: msg.from,
            uploadedAt: createdAt,
          },
        });
      }
    }
  }

  if (lastMessageAt) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt },
    });

    await prisma.conversationMember.updateMany({
      where: { conversationId: conversation.id },
      data: { lastReadAt: lastMessageAt },
    });

    if (options.unreadForUserId) {
      const earlier = new Date(lastMessageAt.getTime() - 5 * MINUTE);
      await prisma.conversationMember.updateMany({
        where: {
          conversationId: conversation.id,
          userId: options.unreadForUserId,
        },
        data: { lastReadAt: earlier },
      });
    }
  }

  return conversation;
}

export async function seedChat(prisma: PrismaClient) {
  console.log("--- Seeding Chat Conversations & Messages ---");

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true, fullName: true },
  });

  const byEmail = (email: string) => users.find((u) => u.email === email);

  const admin = byEmail("admin@company.com");
  const itManager = byEmail("manager.it@company.com");
  const hrManager = byEmail("manager.hr@company.com");
  const mktManager = byEmail("manager.mkt@company.com");
  const employees = users
    .filter((u) => u.email.startsWith("employee"))
    .slice(0, 4);

  if (
    !admin ||
    !itManager ||
    !hrManager ||
    !mktManager ||
    employees.length < 3
  ) {
    console.log("❌ Missing required users for chat seed. Skipping.");
    return;
  }

  const [emp1, emp2, emp3] = employees;

  // Idempotency: nếu admin đã có message thì coi như đã seed
  const existingMessages = await prisma.message.count({
    where: { senderId: admin.id },
  });

  if (existingMessages > 0) {
    console.log("⏭️  Chat already seeded, skipping.");
    return;
  }

  // --------------------------------------------------------------------
  // DIRECT 1: admin <-> itManager  (text + pdf + ảnh)
  // --------------------------------------------------------------------
  await createConversationWithMessages(prisma, {
    type: ConversationType.DIRECT,
    createdById: admin.id,
    members: [
      { userId: admin.id, role: ConversationMemberRole.MEMBER },
      { userId: itManager.id, role: ConversationMemberRole.MEMBER },
    ],
    unreadForUserId: admin.id,
    messages: [
      {
        from: itManager.id,
        offsetMinutes: 0,
        content: `Chào sếp, em vừa tổng hợp báo cáo Q1 cho dự án Alpha ạ. [${CHAT_SEED_MARKER}]`,
      },
      {
        from: admin.id,
        offsetMinutes: 12,
        content: "Ok em, gửi file cho anh xem qua nhé.",
      },
      {
        from: itManager.id,
        offsetMinutes: 18,
        content: "Đây là file budget Q1 em vừa cập nhật ạ.",
        attachments: [FILE_BUDGET],
      },
      {
        from: admin.id,
        offsetMinutes: 45,
        content: "Anh đã xem. Phần chi phí hạ tầng có thể giảm 10% được không?",
      },
      {
        from: itManager.id,
        offsetMinutes: 50,
        content:
          "Để em rà soát lại danh sách dịch vụ và phản hồi sếp trong tuần này ạ.",
      },
      {
        from: admin.id,
        offsetMinutes: 60,
        content: "Tiện đây, gửi anh xin tấm hình họp team hôm thứ Sáu với.",
      },
      {
        from: itManager.id,
        offsetMinutes: 65,
        content: "Dạ đây ạ:",
        attachments: [IMG_TEAM],
      },
    ],
  });

  // --------------------------------------------------------------------
  // DIRECT 2: admin <-> hrManager (text + video)
  // --------------------------------------------------------------------
  await createConversationWithMessages(prisma, {
    type: ConversationType.DIRECT,
    createdById: admin.id,
    members: [
      { userId: admin.id, role: ConversationMemberRole.MEMBER },
      { userId: hrManager.id, role: ConversationMemberRole.MEMBER },
    ],
    messages: [
      {
        from: hrManager.id,
        offsetMinutes: 120,
        content: `Chào anh, em vừa quay xong video onboarding mới ạ.`,
      },
      {
        from: admin.id,
        offsetMinutes: 125,
        content: "Cho anh xem thử với.",
      },
      {
        from: hrManager.id,
        offsetMinutes: 130,
        content: "Đây ạ, dài tầm 3 phút thôi.",
        attachments: [VID_DEMO],
      },
      {
        from: admin.id,
        offsetMinutes: 200,
        content:
          "Video làm tốt lắm em. Có thể chiếu cho batch intern tháng sau được rồi.",
      },
    ],
  });

  // --------------------------------------------------------------------
  // DIRECT 3: itManager <-> employee[0]  (file excel + ảnh design)
  // --------------------------------------------------------------------
  await createConversationWithMessages(prisma, {
    type: ConversationType.DIRECT,
    createdById: itManager.id,
    members: [
      { userId: itManager.id, role: ConversationMemberRole.MEMBER },
      { userId: emp1.id, role: ConversationMemberRole.MEMBER },
    ],
    unreadForUserId: emp1.id,
    messages: [
      {
        from: itManager.id,
        offsetMinutes: 30,
        content: "Em xem giúp anh số liệu KPI tuần này nhé.",
        attachments: [FILE_REPORT],
      },
      {
        from: emp1.id,
        offsetMinutes: 80,
        content: "Dạ em nhận file rồi ạ. Có vài chỗ em sẽ verify lại.",
      },
      {
        from: itManager.id,
        offsetMinutes: 85,
        content: "Và đây là mockup mới phòng design vừa gửi:",
        attachments: [IMG_DESIGN],
      },
      {
        from: emp1.id,
        offsetMinutes: 90,
        content: "Đẹp hơn bản cũ nhiều ạ, để em báo lại team luôn.",
      },
      {
        from: itManager.id,
        offsetMinutes: 360,
        content: "Ok em, có gì update sớm cho anh nhé.",
      },
    ],
  });

  // --------------------------------------------------------------------
  // GROUP 1: "Đội kỹ thuật" — admin + itManager + 2 employees
  // --------------------------------------------------------------------
  await createConversationWithMessages(prisma, {
    type: ConversationType.GROUP,
    name: `Đội kỹ thuật [${CHAT_SEED_MARKER}]`,
    createdById: itManager.id,
    members: [
      { userId: itManager.id, role: ConversationMemberRole.ADMIN },
      { userId: admin.id, role: ConversationMemberRole.MEMBER },
      { userId: emp1.id, role: ConversationMemberRole.MEMBER },
      { userId: emp2.id, role: ConversationMemberRole.MEMBER },
    ],
    unreadForUserId: admin.id,
    messages: [
      {
        from: itManager.id,
        offsetMinutes: 0,
        content:
          "Chào mọi người, đây là nhóm chat chính thức cho đội kỹ thuật. Tin nhắn quan trọng mình sẽ pin sau.",
      },
      {
        from: emp1.id,
        offsetMinutes: 8,
        content: "Em chào cả nhà ạ 👋",
      },
      {
        from: emp2.id,
        offsetMinutes: 10,
        content: "Hi all, có gì cần code review thì tag mình nhé.",
      },
      {
        from: itManager.id,
        offsetMinutes: 25,
        content: "Mình gửi tấm hình team sau buổi off-site tuần trước:",
        attachments: [IMG_TEAM],
      },
      {
        from: admin.id,
        offsetMinutes: 30,
        content:
          "Đội mình quá xịn 🎉. Anh gửi kèm budget Q1 để mọi người tham khảo:",
        attachments: [FILE_BUDGET],
      },
      {
        from: emp1.id,
        offsetMinutes: 50,
        content: "Cảm ơn sếp, em sẽ đọc trong ngày.",
      },
      {
        from: itManager.id,
        offsetMinutes: 120,
        content:
          "Note: standup hàng ngày 9:30 sáng, daily report gửi trong nhóm này luôn nhé.",
      },
      {
        from: emp2.id,
        offsetMinutes: 130,
        content: "Đã rõ anh.",
      },
    ],
  });

  // --------------------------------------------------------------------
  // GROUP 2: "Họp dự án Alpha" — itManager + mktManager + 3 employees
  // --------------------------------------------------------------------
  await createConversationWithMessages(prisma, {
    type: ConversationType.GROUP,
    name: `Họp dự án Alpha [${CHAT_SEED_MARKER}]`,
    createdById: itManager.id,
    members: [
      { userId: itManager.id, role: ConversationMemberRole.ADMIN },
      { userId: mktManager.id, role: ConversationMemberRole.MEMBER },
      { userId: emp1.id, role: ConversationMemberRole.MEMBER },
      { userId: emp2.id, role: ConversationMemberRole.MEMBER },
      { userId: emp3.id, role: ConversationMemberRole.MEMBER },
    ],
    unreadForUserId: emp3.id,
    messages: [
      {
        from: itManager.id,
        offsetMinutes: 0,
        content:
          "Mọi người ơi, mình tạo nhóm này để sync về dự án Alpha. Buổi kick-off sáng mai 10h tại phòng họp B2.",
      },
      {
        from: mktManager.id,
        offsetMinutes: 5,
        content:
          "Mình confirm tham gia. Bên Marketing sẽ trình bày plan launch 30 phút đầu.",
      },
      {
        from: emp2.id,
        offsetMinutes: 12,
        content: "Em gửi mockup landing page mới ạ:",
        attachments: [IMG_DESIGN],
      },
      {
        from: itManager.id,
        offsetMinutes: 20,
        content: "Mockup ổn lắm. Tiện thể đây là chart KPI tuần này:",
        attachments: [IMG_CHART],
      },
      {
        from: emp1.id,
        offsetMinutes: 40,
        content: "Em gửi notes meeting hôm thứ Hai:",
        attachments: [FILE_DOC],
      },
      {
        from: emp3.id,
        offsetMinutes: 90,
        content: "Em đọc xong rồi ạ, vài thắc mắc em note trong file.",
      },
      {
        from: mktManager.id,
        offsetMinutes: 180,
        content: "Sáng mai gặp cả nhóm nhé!",
      },
    ],
  });

  console.log(
    `✅ Seeded 3 direct conversations and 2 group conversations with messages, images, video and files.`,
  );
}
