import {
  PrismaClient,
  Role,
  Status,
  GroupType,
  GroupStatus,
  GroupMemberRole,
  PostVisibility,
  PostStatus,
  CommentStatus,
  ReactionType,
} from "@prisma/client";
import bcrypt from "bcrypt";

import prisma from "../src/utils/prisma";

async function main() {
  console.log("🌱 Start seeding...");

  const defaultPassword = await bcrypt.hash("123456", 10);

  // Xóa dữ liệu theo thứ tự để tránh lỗi khóa ngoại
  await prisma.reaction.deleteMany();
  await prisma.commentMention.deleteMany();
  await prisma.postMention.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postAttachment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.position.deleteMany();

  console.log("🧹 Old data cleared");

  // =========================
  // POSITIONS
  // =========================
  const [internPosition, employeePosition, leadPosition, managerPosition] =
    await Promise.all([
      prisma.position.create({
        data: {
          name: "Intern",
          level: 1,
        },
      }),
      prisma.position.create({
        data: {
          name: "Employee",
          level: 2,
        },
      }),
      prisma.position.create({
        data: {
          name: "Team Lead",
          level: 3,
        },
      }),
      prisma.position.create({
        data: {
          name: "Manager",
          level: 4,
        },
      }),
    ]);

  // =========================
  // DEPARTMENTS
  // =========================
  const [hrDept, itDept, financeDept] = await Promise.all([
    prisma.department.create({
      data: {
        name: "Human Resources",
        description: "Quản lý nhân sự và tuyển dụng",
      },
    }),
    prisma.department.create({
      data: {
        name: "Information Technology",
        description: "Phát triển hệ thống và hỗ trợ kỹ thuật",
      },
    }),
    prisma.department.create({
      data: {
        name: "Finance",
        description: "Quản lý tài chính và kế toán",
      },
    }),
  ]);

  // =========================
  // USERS
  // =========================
  const admin = await prisma.user.create({
    data: {
      fullName: "System Admin",
      email: "admin@company.com",
      password: defaultPassword,
      role: Role.ADMIN,
      status: Status.ACTIVE,
      departmentId: itDept.id,
      positionId: managerPosition.id,
    },
  });

  const managerHR = await prisma.user.create({
    data: {
      fullName: "Nguyen Thi Lan",
      email: "lan.hr@company.com",
      password: defaultPassword,
      role: Role.MANAGER,
      status: Status.ACTIVE,
      departmentId: hrDept.id,
      positionId: managerPosition.id,
    },
  });

  const managerIT = await prisma.user.create({
    data: {
      fullName: "Tran Minh Khoa",
      email: "khoa.it@company.com",
      password: defaultPassword,
      role: Role.MANAGER,
      status: Status.ACTIVE,
      departmentId: itDept.id,
      positionId: managerPosition.id,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      fullName: "Le Hoang Nam",
      email: "nam@company.com",
      password: defaultPassword,
      role: Role.EMPLOYEE,
      status: Status.ACTIVE,
      departmentId: itDept.id,
      positionId: employeePosition.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      fullName: "Pham Thu Ha",
      email: "ha@company.com",
      password: defaultPassword,
      role: Role.EMPLOYEE,
      status: Status.ACTIVE,
      departmentId: hrDept.id,
      positionId: employeePosition.id,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      fullName: "Vo Quoc Bao",
      email: "bao@company.com",
      password: defaultPassword,
      role: Role.EMPLOYEE,
      status: Status.ACTIVE,
      departmentId: financeDept.id,
      positionId: leadPosition.id,
    },
  });

  console.log("👤 Users created");

  // =========================
  // UPDATE DEPARTMENT MANAGERS
  // =========================
  await prisma.department.update({
    where: { id: hrDept.id },
    data: { managerId: managerHR.id },
  });

  await prisma.department.update({
    where: { id: itDept.id },
    data: { managerId: managerIT.id },
  });

  // =========================
  // PROFILES
  // =========================
  await prisma.profile.createMany({
    data: [
      {
        userId: admin.id,
        bio: "Quản trị hệ thống nội bộ",
        phone: "0900000001",
        gender: "Male",
        address: "Ho Chi Minh City",
        avatarUrl: "https://example.com/avatars/admin.png",
      },
      {
        userId: managerHR.id,
        bio: "HR Manager",
        phone: "0900000002",
        gender: "Female",
        address: "Ho Chi Minh City",
        avatarUrl: "https://example.com/avatars/lan.png",
      },
      {
        userId: managerIT.id,
        bio: "IT Manager",
        phone: "0900000003",
        gender: "Male",
        address: "Ha Noi",
        avatarUrl: "https://example.com/avatars/khoa.png",
      },
      {
        userId: employee1.id,
        bio: "Backend Developer",
        phone: "0900000004",
        gender: "Male",
        address: "Da Nang",
        avatarUrl: "https://example.com/avatars/nam.png",
      },
      {
        userId: employee2.id,
        bio: "HR Executive",
        phone: "0900000005",
        gender: "Female",
        address: "Can Tho",
        avatarUrl: "https://example.com/avatars/ha.png",
      },
      {
        userId: employee3.id,
        bio: "Finance Lead",
        phone: "0900000006",
        gender: "Male",
        address: "Ho Chi Minh City",
        avatarUrl: "https://example.com/avatars/bao.png",
      },
    ],
  });

  // =========================
  // GROUPS
  // =========================
  const engineeringGroup = await prisma.group.create({
    data: {
      groupName: "Engineering Hub",
      description: "Không gian trao đổi cho team kỹ thuật",
      groupType: GroupType.PUBLIC,
      status: GroupStatus.ACTIVE,
      createdBy: managerIT.id,
    },
  });

  const hrGroup = await prisma.group.create({
    data: {
      groupName: "HR Corner",
      description: "Nhóm trao đổi thông tin nhân sự",
      groupType: GroupType.PRIVATE,
      status: GroupStatus.ACTIVE,
      createdBy: managerHR.id,
    },
  });

  const companyNewsGroup = await prisma.group.create({
    data: {
      groupName: "Company News",
      description: "Cập nhật thông báo nội bộ toàn công ty",
      groupType: GroupType.PUBLIC,
      status: GroupStatus.ACTIVE,
      createdBy: admin.id,
    },
  });

  console.log("👥 Groups created");

  // =========================
  // GROUP MEMBERS
  // =========================
  await prisma.groupMember.createMany({
    data: [
      {
        groupId: engineeringGroup.id,
        userId: managerIT.id,
        memberRole: GroupMemberRole.ADMIN,
      },
      {
        groupId: engineeringGroup.id,
        userId: employee1.id,
        memberRole: GroupMemberRole.MEMBER,
      },
      {
        groupId: engineeringGroup.id,
        userId: admin.id,
        memberRole: GroupMemberRole.MODERATOR,
      },
      {
        groupId: hrGroup.id,
        userId: managerHR.id,
        memberRole: GroupMemberRole.ADMIN,
      },
      {
        groupId: hrGroup.id,
        userId: employee2.id,
        memberRole: GroupMemberRole.MEMBER,
      },
      {
        groupId: companyNewsGroup.id,
        userId: admin.id,
        memberRole: GroupMemberRole.ADMIN,
      },
      {
        groupId: companyNewsGroup.id,
        userId: managerHR.id,
        memberRole: GroupMemberRole.MEMBER,
      },
      {
        groupId: companyNewsGroup.id,
        userId: managerIT.id,
        memberRole: GroupMemberRole.MEMBER,
      },
      {
        groupId: companyNewsGroup.id,
        userId: employee1.id,
        memberRole: GroupMemberRole.MEMBER,
      },
      {
        groupId: companyNewsGroup.id,
        userId: employee2.id,
        memberRole: GroupMemberRole.MEMBER,
      },
      {
        groupId: companyNewsGroup.id,
        userId: employee3.id,
        memberRole: GroupMemberRole.MEMBER,
      },
    ],
  });

  // =========================
  // POSTS IN GROUP
  // =========================
  const post1 = await prisma.post.create({
    data: {
      userId: managerIT.id,
      groupId: engineeringGroup.id,
      content:
        "Chào mừng mọi người đến với Engineering Hub. Chúng ta sẽ cập nhật roadmap backend tại đây.",
      visibility: PostVisibility.GROUP,
      viewCount: 10,
      isPinned: true,
      status: PostStatus.ACTIVE,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      userId: admin.id,
      groupId: companyNewsGroup.id,
      content:
        "Thông báo: Công ty sẽ tổ chức town hall vào thứ Sáu tuần này lúc 15:00.",
      visibility: PostVisibility.PUBLIC,
      viewCount: 25,
      isPinned: true,
      status: PostStatus.ACTIVE,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      userId: employee2.id,
      groupId: hrGroup.id,
      content:
        "Team HR đang cập nhật chính sách nghỉ phép năm 2026. Mọi người góp ý nhé.",
      visibility: PostVisibility.GROUP,
      viewCount: 8,
      isPinned: false,
      status: PostStatus.ACTIVE,
    },
  });

  console.log("📝 Group posts created");

  // =========================
  // ATTACHMENTS FOR GROUP POSTS
  // =========================
  await prisma.postAttachment.createMany({
    data: [
      {
        postId: post1.id,
        fileName: "backend-roadmap.pdf",
        fileUrl: "https://example.com/files/backend-roadmap.pdf",
        fileType: "application/pdf",
      },
      {
        postId: post2.id,
        fileName: "townhall-banner.png",
        fileUrl: "https://example.com/files/townhall-banner.png",
        fileType: "image/png",
      },
    ],
  });

  // =========================
  // COMMENTS FOR GROUP POSTS
  // =========================
  const comment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: employee1.id,
      content: "Em sẽ chuẩn bị tài liệu API cho sprint tới.",
      status: CommentStatus.ACTIVE,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: admin.id,
      content: "Nhớ cập nhật thêm phần auth flow nhé.",
      status: CommentStatus.ACTIVE,
    },
  });

  const replyComment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: managerIT.id,
      parentCommentId: comment1.id,
      content: "Ok Nam, em chuẩn bị giúp anh trước thứ Năm.",
      status: CommentStatus.ACTIVE,
    },
  });

  const comment3 = await prisma.comment.create({
    data: {
      postId: post2.id,
      userId: employee3.id,
      content: "Đã rõ, em sẽ tham gia đầy đủ.",
      status: CommentStatus.ACTIVE,
    },
  });

  const comment4 = await prisma.comment.create({
    data: {
      postId: post3.id,
      userId: managerHR.id,
      content: "Mọi người chú ý deadline phản hồi trước thứ Tư.",
      status: CommentStatus.ACTIVE,
    },
  });

  console.log("💬 Group post comments created");

  // =========================
  // MENTIONS FOR GROUP POSTS
  // =========================
  await prisma.postMention.createMany({
    data: [
      {
        postId: post1.id,
        mentionedUserId: employee1.id,
      },
      {
        postId: post2.id,
        mentionedUserId: managerHR.id,
      },
      {
        postId: post2.id,
        mentionedUserId: managerIT.id,
      },
    ],
  });

  await prisma.commentMention.createMany({
    data: [
      {
        commentId: comment2.id,
        mentionedUserId: employee1.id,
      },
      {
        commentId: replyComment1.id,
        mentionedUserId: employee1.id,
      },
    ],
  });

  // =========================
  // REACTIONS FOR GROUP POSTS
  // =========================
  await prisma.reaction.createMany({
    data: [
      {
        userId: admin.id,
        postId: post1.id,
        reactionType: ReactionType.LIKE,
      },
      {
        userId: employee1.id,
        postId: post2.id,
        reactionType: ReactionType.LOVE,
      },
      {
        userId: employee2.id,
        postId: post2.id,
        reactionType: ReactionType.LIKE,
      },
      {
        userId: managerHR.id,
        commentId: comment3.id,
        reactionType: ReactionType.LIKE,
      },
      {
        userId: managerIT.id,
        commentId: comment4.id,
        reactionType: ReactionType.WOW,
      },
    ],
  });

  // =========================
  // 20 PUBLIC POSTS FOR NEWS FEED
  // =========================
  const feedUsers = [
    admin,
    managerHR,
    managerIT,
    employee1,
    employee2,
    employee3,
  ];

  const publicPostContents = [
    "Chào buổi sáng mọi người, chúc cả công ty có một ngày làm việc hiệu quả.",
    "Hôm nay team mình đã hoàn thành mốc công việc quan trọng của sprint tuần này.",
    "Mọi người nhớ kiểm tra email để cập nhật lịch họp nội bộ nhé.",
    "Cuối tuần này công ty có hoạt động gắn kết nội bộ, ai tham gia comment bên dưới nha.",
    "Chúc mừng team IT đã xử lý thành công lỗi hệ thống trong thời gian ngắn.",
    "Phòng HR đang tổng hợp nhu cầu đào tạo quý tới, mọi người gửi đề xuất giúp nhé.",
    "Ai có tài liệu hay về clean architecture có thể chia sẻ cho mọi người cùng học không?",
    "Hôm nay căn tin có món mới, mọi người thử chưa?",
    "Cảm ơn mọi người đã hỗ trợ hoàn thành báo cáo đúng hạn.",
    "Tuần này khối lượng công việc khá nhiều, mọi người cố gắng giữ sức khỏe nhé.",
    "Mình vừa hoàn thành một tài liệu hướng dẫn mới cho người mới vào công ty.",
    "Có ai quan tâm đến buổi chia sẻ về kỹ năng thuyết trình vào tuần sau không?",
    "Hệ thống đã được nâng cấp phiên bản mới, nếu có lỗi mọi người báo lại giúp mình.",
    "Mọi người nghĩ sao nếu tổ chức thêm một buổi coffee talk giữa các phòng ban?",
    "Chúc mừng bạn trong team vừa đạt thành tích rất tốt trong tháng này.",
    "Nhắc nhẹ mọi người cập nhật tiến độ công việc trước cuối ngày nhé.",
    "Ai đang làm việc remote hôm nay thì check-in vào group chung giúp mình.",
    "Vừa có một ý tưởng nhỏ để cải thiện quy trình onboarding cho nhân sự mới.",
    "Cảm ơn team Finance đã hỗ trợ rất nhanh phần ngân sách cho dự án.",
    "Hy vọng tháng này chúng ta sẽ đạt kết quả thật tốt cùng nhau.",
  ];

  const publicPosts: Awaited<ReturnType<typeof prisma.post.create>>[] = [];

  for (let i = 0; i < 20; i++) {
    const author = feedUsers[i % feedUsers.length];

    const createdPost = await prisma.post.create({
      data: {
        userId: author.id,
        groupId: null,
        content: publicPostContents[i],
        visibility: PostVisibility.PUBLIC,
        viewCount: Math.floor(Math.random() * 200) + 20,
        isPinned: i < 2,
        status: PostStatus.ACTIVE,
      },
    });

    publicPosts.push(createdPost);
  }

  console.log("📰 20 public news feed posts created");

  // =========================
  // ATTACHMENTS FOR PUBLIC POSTS
  // =========================
  await prisma.postAttachment.createMany({
    data: [
      {
        postId: publicPosts[1].id,
        fileName: "company-update-q1.pdf",
        fileUrl: "https://example.com/files/company-update-q1.pdf",
        fileType: "application/pdf",
      },
      {
        postId: publicPosts[4].id,
        fileName: "system-upgrade.png",
        fileUrl: "https://example.com/files/system-upgrade.png",
        fileType: "image/png",
      },
      {
        postId: publicPosts[7].id,
        fileName: "lunch-menu.jpg",
        fileUrl: "https://example.com/files/lunch-menu.jpg",
        fileType: "image/jpeg",
      },
      {
        postId: publicPosts[10].id,
        fileName: "onboarding-guide.docx",
        fileUrl: "https://example.com/files/onboarding-guide.docx",
        fileType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      {
        postId: publicPosts[15].id,
        fileName: "daily-progress.xlsx",
        fileUrl: "https://example.com/files/daily-progress.xlsx",
        fileType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  console.log("📎 Public post attachments created");

  // =========================
  // COMMENTS FOR PUBLIC POSTS
  // =========================
  const publicComments: Awaited<ReturnType<typeof prisma.comment.create>>[] =
    [];

  for (let i = 0; i < publicPosts.length; i++) {
    const post = publicPosts[i];

    const commenter1 = feedUsers[(i + 1) % feedUsers.length];
    const commenter2 = feedUsers[(i + 2) % feedUsers.length];
    const replier = feedUsers[(i + 3) % feedUsers.length];

    const commentA = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: commenter1.id,
        content: "Bài này hữu ích đó, cảm ơn bạn đã chia sẻ.",
        status: CommentStatus.ACTIVE,
      },
    });

    const commentB = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: commenter2.id,
        content: "Mình đã đọc, nội dung rất rõ ràng và dễ theo dõi.",
        status: CommentStatus.ACTIVE,
      },
    });

    const reply = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: replier.id,
        parentCommentId: commentA.id,
        content: "Đồng ý luôn, mình cũng nghĩ vậy.",
        status: CommentStatus.ACTIVE,
      },
    });

    publicComments.push(commentA, commentB, reply);
  }

  console.log("💬 Public post comments created");

  // =========================
  // POST MENTIONS FOR PUBLIC POSTS
  // =========================
  await prisma.postMention.createMany({
    data: [
      {
        postId: publicPosts[0].id,
        mentionedUserId: employee1.id,
      },
      {
        postId: publicPosts[3].id,
        mentionedUserId: employee2.id,
      },
      {
        postId: publicPosts[5].id,
        mentionedUserId: managerIT.id,
      },
      {
        postId: publicPosts[8].id,
        mentionedUserId: managerHR.id,
      },
      {
        postId: publicPosts[12].id,
        mentionedUserId: employee3.id,
      },
      {
        postId: publicPosts[17].id,
        mentionedUserId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("🔔 Public post mentions created");

  // =========================
  // COMMENT MENTIONS FOR PUBLIC POSTS
  // =========================
  await prisma.commentMention.createMany({
    data: [
      {
        commentId: publicComments[0].id,
        mentionedUserId: managerIT.id,
      },
      {
        commentId: publicComments[4].id,
        mentionedUserId: employee1.id,
      },
      {
        commentId: publicComments[8].id,
        mentionedUserId: employee2.id,
      },
      {
        commentId: publicComments[12].id,
        mentionedUserId: managerHR.id,
      },
      {
        commentId: publicComments[16].id,
        mentionedUserId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("💡 Public comment mentions created");

  // =========================
  // REACTIONS FOR PUBLIC POSTS AND COMMENTS
  // =========================
  const reactionData: {
    userId: number;
    postId?: number;
    commentId?: number;
    reactionType: ReactionType;
  }[] = [];

  for (let i = 0; i < publicPosts.length; i++) {
    const post = publicPosts[i];

    reactionData.push(
      {
        userId: feedUsers[(i + 1) % feedUsers.length].id,
        postId: post.id,
        reactionType: ReactionType.LIKE,
      },
      {
        userId: feedUsers[(i + 2) % feedUsers.length].id,
        postId: post.id,
        reactionType: ReactionType.LOVE,
      },
      {
        userId: feedUsers[(i + 3) % feedUsers.length].id,
        postId: post.id,
        reactionType: ReactionType.WOW,
      },
    );
  }

  for (let i = 0; i < publicComments.length; i += 3) {
    reactionData.push(
      {
        userId: admin.id,
        commentId: publicComments[i].id,
        reactionType: ReactionType.LIKE,
      },
      {
        userId: managerIT.id,
        commentId: publicComments[i + 1].id,
        reactionType: ReactionType.HAHA,
      },
    );
  }

  await prisma.reaction.createMany({
    data: reactionData,
    skipDuplicates: true,
  });

  console.log("🔥 Public post reactions created");

  console.log("✅ Seed completed successfully");
  console.log("");
  console.log("Tài khoản test:");
  console.log("ADMIN: admin@company.com / 123456");
  console.log("MANAGER HR: lan.hr@company.com / 123456");
  console.log("MANAGER IT: khoa.it@company.com / 123456");
  console.log("EMPLOYEE: nam@company.com / 123456");
  console.log("EMPLOYEE: ha@company.com / 123456");
  console.log("EMPLOYEE: bao@company.com / 123456");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
