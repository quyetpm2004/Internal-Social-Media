import {
  PrismaClient,
  PostVisibility,
  ReactionType,
  AttachmentType,
} from "@prisma/client";

export async function seedPosts(prisma: PrismaClient) {
  console.log("--- Seeding Posts, Comments & Reactions ---");

  const user = await prisma.user.findUnique({
    where: { email: "employee1@company.com" },
  });
  const manager = await prisma.user.findUnique({
    where: { email: "manager.it@company.com" },
  });

  if (!user || !manager) {
    console.log("❌ Seed Users not found. Skipping posts.");
    return;
  }

  // 1. Tạo Post trước để lấy ID
  const newPost = await prisma.post.create({
    data: {
      userId: user.id,
      content:
        "Chào mọi người, đây là bài viết đầu tiên của tôi trên mạng xã hội nội bộ!",
      visibility: PostVisibility.PUBLIC,
      attachments: {
        create: {
          fileName: "welcome.png",
          fileKey: "uploads/welcome_key",
          mimeType: "image/png",
          fileSize: 102455,
          attachmentType: AttachmentType.IMAGE,
        },
      },
      reactions: {
        create: {
          userId: manager.id,
          reactionType: ReactionType.LIKE,
        },
      },
    },
  });

  // 2. Tạo Comment cấp 1
  const parentComment = await prisma.comment.create({
    data: {
      postId: newPost.id,
      userId: manager.id,
      content: "Chào mừng em gia nhập đội ngũ IT nhé!",
      status: "ACTIVE",
    },
  });

  // 3. Tạo Reply (Comment cấp 2) - Phải chỉ định rõ cả postId và parentCommentId
  await prisma.comment.create({
    data: {
      postId: newPost.id,
      userId: user.id,
      parentCommentId: parentComment.id,
      content: "Dạ em cảm ơn sếp nhiều ạ!",
      status: "ACTIVE",
    },
  });

  console.log("✅ Seeding posts and comments finished.");
}
