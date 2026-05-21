import {
  PrismaClient,
  PostVisibility,
  ReactionType,
  AttachmentType,
  MediaStatus,
} from "@prisma/client";

const POST_SEED_MARKER = "seed-post-v2";

const IMAGE_ATTACHMENT = {
  fileName: "welcome.png",
  fileKey: "uploads/welcome_key.png",
  mimeType: "image/png",
  fileSize: 102455,
  attachmentType: AttachmentType.IMAGE,
  status: MediaStatus.ACTIVE,
};

const FEED_TEXT_CONTENTS = [
  "Chào mọi người, hôm nay team mình deploy feature mới lên staging rồi nhé!",
  "Có ai rảnh chiều nay review giúp mình PR #128 không ạ?",
  "Mình vừa hoàn thành khóa học nội bộ về TypeScript, recommend mọi người tham gia.",
  "Tuần sau công ty tổ chức team building tại Vũng Tàu, mn nhớ đăng ký trước ngày 25.",
  "Tip nhỏ: dùng Prisma `include` thay vì query lặp sẽ giảm N+1 đáng kể.",
  "Hôm nay cafeteria có món mới, ai thử rồi cho feedback với!",
  "Cảm ơn phòng HR đã hỗ trợ onboarding cho batch intern mới.",
  "Ai có template slide báo cáo tuần cho team IT share giúp mình với.",
  "Sáng nay standup ngắn gọn nhưng hiệu quả, keep it up team!",
  "Mình đang tìm buddy học React Query, inbox nếu cùng mục tiêu nhé.",
  "Chúc mừng sinh nhật bạn Lan ở phòng Marketing!",
  "Policy WFH tuần này: tối đa 2 ngày, nhớ sync với quản lý trước.",
  "Vừa fix xong bug production liên quan upload ảnh, cảm ơn team QA.",
  "Chia sẻ bài viết hay về soft skills cho leader trẻ.",
  "Office sẽ bảo trì điều hòa tầng 3 vào thứ Bảy, mn lưu ý.",
  "Mình recommend dùng Biome thay ESLint cho project nhỏ, nhanh lắm.",
  "Có ai đi cùng xe từ Q7 đến công ty sáng mai không?",
  "Kết quả khảo sát hài lòng nhân viên Q1 sẽ công bố cuối tuần.",
  "Hackathon nội bộ tháng sau: đăng ký nhóm trước 30/5 nhé.",
  "Hôm qua buổi workshop AWS rất bổ ích, thanks anh DevOps.",
  "Nhắc nhở: đổi mật khẩu định kỳ 90 ngày theo quy định IT.",
  "Team mình vừa đạt sprint goal, celebrate bằng trà sữa chiều nay!",
  "Tuyển thêm 2 vị trí Frontend, JD đã đăng trên intranet.",
  "Ai dùng VS Code extension Prisma chưa? Cực tiện cho schema.",
  "Lịch nghỉ lễ sắp tới đã cập nhật trên portal, check giúp nhau.",
  "Chia sẻ case study migrate MySQL sang Prisma 7 cho dự án mới.",
  "Mình cần feedback slide thuyết trình all-hands, comment giúp nhé.",
];

const FEED_IMAGE_CONTENTS = [
  "Chào mọi người, đây là bài viết đầu tiên của tôi trên mạng xã hội nội bộ!",
  "Ảnh team sau buổi demo sprint — cảm ơn mọi người đã cố gắng!",
  "Khoảnh khắc team building tuần trước, lưu lại kỷ niệm đẹp.",
];

const GROUP_POST_TEMPLATES = [
  "Thông báo trong nhóm: lịch họp tuần này vào thứ Tư 14h.",
  "Mọi người cập nhật tiến độ task trên board giúp admin nhé.",
  "Tài liệu onboarding nhóm đã upload lên drive nội bộ.",
  "Ai có câu hỏi về quy trình trong nhóm cứ comment thread này.",
];

function pickUserIds(userIds: number[], index: number) {
  return userIds[index % userIds.length];
}

export async function seedPosts(prisma: PrismaClient) {
  console.log("--- Seeding Posts, Comments & Reactions ---");

  const feedTarget = 30;
  const existingFeed = await prisma.post.count({
    where: {
      groupId: null,
      content: { contains: POST_SEED_MARKER },
    },
  });
  if (existingFeed >= feedTarget) {
    console.log("⏭️  Posts already seeded, skipping.");
    return;
  }

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  if (users.length < 3) {
    console.log("❌ Not enough users. Skipping posts.");
    return;
  }

  const userIds = users.map((u) => u.id);
  const manager = await prisma.user.findFirst({
    where: { role: "MANAGER" },
    select: { id: true },
  });

  // --- New feed: 30 posts (3 có ảnh) ---
  const imageIndices = new Set([0, 10, 20]);

  for (let i = 0; i < feedTarget; i++) {
    const hasImage = imageIndices.has(i);
    const content = hasImage
      ? `${FEED_IMAGE_CONTENTS[i % FEED_IMAGE_CONTENTS.length]} ${POST_SEED_MARKER}`
      : `${FEED_TEXT_CONTENTS[i % FEED_TEXT_CONTENTS.length]} ${POST_SEED_MARKER}`;

    const post = await prisma.post.create({
      data: {
        userId: pickUserIds(userIds, i),
        content,
        visibility: PostVisibility.PUBLIC,
        groupId: null,
        ...(hasImage && {
          attachments: { create: IMAGE_ATTACHMENT },
        }),
        ...(i === 0 &&
          manager && {
            reactions: {
              create: {
                userId: manager.id,
                reactionType: ReactionType.LIKE,
              },
            },
          }),
      },
    });

    if (i === 0 && manager) {
      const parentComment = await prisma.comment.create({
        data: {
          postId: post.id,
          userId: manager.id,
          content: "Chào mừng em gia nhập đội ngũ IT nhé!",
          status: "ACTIVE",
        },
      });

      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: pickUserIds(userIds, 0),
          parentCommentId: parentComment.id,
          content: "Dạ em cảm ơn sếp nhiều ạ!",
          status: "ACTIVE",
        },
      });
    }
  }

  // --- Group posts: 3–4 post / group ---
  const groups = await prisma.group.findMany({
    where: { description: { contains: "seed-group-v2" } },
    include: {
      members: { where: { status: "ACTIVE" }, select: { userId: true } },
    },
  });

  let groupPostCount = 0;
  for (const [gIndex, group] of groups.entries()) {
    const postsInGroup = 3 + (gIndex % 2);
    const memberIds =
      group.members.length > 0
        ? group.members.map((m) => m.userId)
        : userIds;

    for (let p = 0; p < postsInGroup; p++) {
      const authorId = memberIds[p % memberIds.length];
      const template =
        GROUP_POST_TEMPLATES[(gIndex + p) % GROUP_POST_TEMPLATES.length];

      await prisma.post.create({
        data: {
          userId: authorId,
          groupId: group.id,
          content: `[${group.groupName}] ${template} ${POST_SEED_MARKER}`,
          visibility: PostVisibility.GROUP,
        },
      });
      groupPostCount++;
    }
  }

  console.log(
    `✅ Seeded ${feedTarget} feed posts (3 with images) and ${groupPostCount} group posts.`,
  );
}
