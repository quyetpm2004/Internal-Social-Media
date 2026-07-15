import {
  ReactionType,
  GroupMemberRole,
  GroupMemberStatus,
  Role,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getFileUrl } from "@/modules/file/file.service";
import {
  assertGroupAllowsAnonymousContent,
  maskGroupCommentAuthors,
} from "@/shared/utils/group-anonymous";
import {
  notifyCommentMentions,
  notifyCommentReaction,
  notifyCommentReply,
  notifyPostComment,
} from "@/modules/notification/notification.service";
import {
  assertMentionedUsersExist,
  assertMentionedUsersInGroup,
  resolveMentionTargets,
} from "@/shared/utils/mentions";
import * as commentRepo from "@/modules/comment/comment.repository";

type GetPostCommentsParams = {
  userId: number;
  postId: number;
  page?: number;
  limit?: number;
};

type GetCommentRepliesParams = {
  userId: number;
  commentId: number;
  page?: number;
  limit?: number;
};

type CreateCommentParams = {
  userId: number;
  postId: number;
  content: string;
  mentionedUserIds?: number[];
  mentionAll?: boolean;
  isAnonymous?: boolean;
};

type ReplyCommentParams = {
  userId: number;
  parentCommentId: number;
  content: string;
  mentionedUserIds?: number[];
  mentionAll?: boolean;
  isAnonymous?: boolean;
};

type ReactCommentParams = {
  userId: number;
  commentId: number;
  reactionType: ReactionType;
};

type UpdateCommentParams = {
  userId: number;
  commentId: number;
  content: string;
  mentionedUserIds?: number[];
  mentionAll?: boolean;
};

type DeleteCommentParams = {
  userId: number;
  commentId: number;
};

type PinCommentParams = {
  userId: number;
  commentId: number;
  isPinned: boolean;
};

const assertCanPinComment = async (postId: number, userId: number) => {
  const post = await commentRepo.getPostBasic(postId);

  if (!post) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  // chủ bài được ghim
  if (post.userId === userId) {
    return;
  }

  if (post.groupId) {
    const member = await commentRepo.getMembershipRole(post.groupId, userId);

    if (
      member?.status === GroupMemberStatus.ACTIVE &&
      (member.memberRole === GroupMemberRole.ADMIN ||
        member.memberRole === GroupMemberRole.MODERATOR)
    ) {
      return;
    }
  } else {
    const user = await commentRepo.getUserRole(userId);

    if (user?.role === Role.ADMIN) {
      return;
    }
  }

  throw new AppError(403, "Bạn không có quyền ghim bình luận");
};

const formatCommentResponse = async (comment: any) => ({
  id: comment.id,
  postId: comment.postId,
  userId: comment.userId,
  parentCommentId: comment.parentCommentId,
  content: comment.content,
  status: comment.status,
  isAnonymous: comment.isAnonymous ?? false,
  isPinned: comment.isPinned ?? false,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  user: {
    ...comment.user,
    profile: comment.user?.profile
      ? {
          ...comment.user.profile,
          avatarUrl: comment.user.profile.avatarKey
            ? await getFileUrl(comment.user.profile.avatarKey, 24 * 60 * 60)
            : null,
        }
      : null,
  },
  mentions: comment.mentions,
  replyCount: comment._count?.replies ?? 0,
  reactionCount: comment._count?.reactions ?? 0,
  currentReaction: comment.reactions?.[0]?.reactionType ?? null,
});

export const getPostCommentsService = async ({
  userId,
  postId,
  page = 1,
  limit = 10,
}: GetPostCommentsParams) => {
  const skip = (page - 1) * limit;

  const existingPost = await commentRepo.getPostBasic(postId);

  if (!existingPost) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new AppError(400, "Bài viết không khả dụng");
  }

  const comments = await commentRepo.getRootComments(
    postId,
    userId,
    skip,
    limit + 1,
  );

  const hasMore = comments.length > limit;
  const normalizedComments = hasMore ? comments.slice(0, limit) : comments;

  let formattedComments = await Promise.all(
    normalizedComments.map(formatCommentResponse),
  );

  if (existingPost.groupId) {
    formattedComments = await maskGroupCommentAuthors(
      existingPost.groupId,
      userId,
      formattedComments,
    );
  }

  return {
    page,
    limit,
    hasMore,
    comments: formattedComments,
  };
};

export const getCommentRepliesService = async ({
  userId,
  commentId,
  page = 1,
  limit = 10,
}: GetCommentRepliesParams) => {
  const skip = (page - 1) * limit;

  const existingComment = await commentRepo.getCommentForReplies(commentId);

  if (!existingComment) {
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment không khả dụng");
  }

  const replies = await commentRepo.getReplies(
    commentId,
    userId,
    skip,
    limit + 1,
  );

  const hasMore = replies.length > limit;
  const normalizedReplies = hasMore ? replies.slice(0, limit) : replies;

  let formattedReplies = await Promise.all(
    normalizedReplies.map(formatCommentResponse),
  );

  const groupId = existingComment.post?.groupId;
  if (groupId) {
    formattedReplies = await maskGroupCommentAuthors(
      groupId,
      userId,
      formattedReplies,
    );
  }

  return {
    page,
    limit,
    hasMore,
    replies: formattedReplies,
  };
};

export const createCommentService = async ({
  userId,
  postId,
  content,
  mentionedUserIds = [],
  mentionAll = false,
  isAnonymous: wantsAnonymous = false,
}: CreateCommentParams) => {
  const [existingUser, existingPost] = await Promise.all([
    commentRepo.getUserId(userId),
    commentRepo.getPostBasic(postId),
  ]);

  if (!existingUser) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  if (!existingPost) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new AppError(400, "Bài viết không khả dụng");
  }

  const isAnonymous = wantsAnonymous === true;
  if (existingPost.groupId) {
    await assertGroupAllowsAnonymousContent(existingPost.groupId, isAnonymous);
  } else if (isAnonymous) {
    throw new AppError(400, "Chỉ có thể bình luận ẩn danh trong nhóm");
  }

  const uniqueMentionedUserIds = await resolveMentionTargets({
    mentionAll,
    mentionedUserIds,
    actorId: userId,
    groupId: existingPost.groupId,
  });
  await assertMentionedUsersExist(uniqueMentionedUserIds);
  if (existingPost.groupId) {
    await assertMentionedUsersInGroup(
      existingPost.groupId,
      uniqueMentionedUserIds,
    );
  }

  const comment = await commentRepo.createComment({
    postId,
    userId,
    content,
    isAnonymous,
    mentionedUserIds: uniqueMentionedUserIds,
  });

  await notifyPostComment(postId, comment.id, userId);
  await notifyCommentMentions(
    postId,
    comment.id,
    userId,
    uniqueMentionedUserIds,
  );

  const formatted = await formatCommentResponse(comment);
  if (!existingPost.groupId) {
    return formatted;
  }

  const [masked] = await maskGroupCommentAuthors(existingPost.groupId, userId, [
    formatted,
  ]);
  return masked;
};

export const replyCommentService = async ({
  userId,
  parentCommentId,
  content,
  mentionedUserIds = [],
  mentionAll = false,
  isAnonymous: wantsAnonymous = false,
}: ReplyCommentParams) => {
  const [existingUser, parentComment] = await Promise.all([
    commentRepo.getUserId(userId),
    commentRepo.getParentComment(parentCommentId),
  ]);

  if (!existingUser) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  if (!parentComment) {
    throw new AppError(404, "Comment cha không tồn tại");
  }

  if (parentComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment cha không khả dụng");
  }

  const isAnonymous = wantsAnonymous === true;
  const groupId = parentComment.post?.groupId;
  if (groupId) {
    await assertGroupAllowsAnonymousContent(groupId, isAnonymous);
  } else if (isAnonymous) {
    throw new AppError(400, "Chỉ có thể bình luận ẩn danh trong nhóm");
  }

  const uniqueMentionedUserIds = await resolveMentionTargets({
    mentionAll,
    mentionedUserIds,
    actorId: userId,
    groupId: groupId ?? null,
  });
  await assertMentionedUsersExist(uniqueMentionedUserIds);
  if (groupId) {
    await assertMentionedUsersInGroup(groupId, uniqueMentionedUserIds);
  }

  const reply = await commentRepo.createComment({
    postId: parentComment.postId,
    userId,
    parentCommentId,
    content,
    isAnonymous,
    mentionedUserIds: uniqueMentionedUserIds,
  });

  await notifyCommentReply(
    parentComment.postId,
    reply.id,
    parentCommentId,
    userId,
  );
  await notifyCommentMentions(
    parentComment.postId,
    reply.id,
    userId,
    uniqueMentionedUserIds,
  );

  const formatted = await formatCommentResponse(reply);
  if (!groupId) {
    return formatted;
  }

  const [masked] = await maskGroupCommentAuthors(groupId, userId, [formatted]);
  return masked;
};

export const reactCommentService = async ({
  userId,
  commentId,
  reactionType,
}: ReactCommentParams) => {
  const [existingUser, existingComment] = await Promise.all([
    commentRepo.getUserId(userId),
    commentRepo.getCommentStatus(commentId),
  ]);

  if (!existingUser) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  if (!existingComment) {
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment không khả dụng để tương tác");
  }

  const existingReaction = await commentRepo.getUserCommentReaction(
    userId,
    commentId,
  );

  if (!existingReaction) {
    const createdReaction = await commentRepo.addCommentReaction(
      userId,
      commentId,
      reactionType,
    );

    const stats = await commentRepo.getCommentReactionStats(commentId);
    await notifyCommentReaction(commentId, userId, reactionType);

    return {
      message: "Thả cảm xúc cho comment thành công",
      data: {
        action: "CREATED",
        currentReaction: createdReaction.reactionType,
        ...stats,
        reaction: createdReaction,
      },
    };
  }

  if (existingReaction.reactionType === reactionType) {
    await commentRepo.removeCommentReaction(userId, commentId);

    const stats = await commentRepo.getCommentReactionStats(commentId);

    return {
      message: "Bỏ cảm xúc khỏi comment thành công",
      data: {
        action: "REMOVED",
        currentReaction: null,
        ...stats,
        reaction: null,
      },
    };
  }

  const updatedReaction = await commentRepo.changeCommentReaction(
    userId,
    commentId,
    reactionType,
  );

  const stats = await commentRepo.getCommentReactionStats(commentId);

  return {
    message: "Cập nhật cảm xúc comment thành công",
    data: {
      action: "UPDATED",
      currentReaction: updatedReaction.reactionType,
      ...stats,
      reaction: updatedReaction,
    },
  };
};

export const updateCommentService = async ({
  userId,
  commentId,
  content,
  mentionedUserIds = [],
  mentionAll = false,
}: UpdateCommentParams) => {
  const existingComment = await commentRepo.getCommentForEdit(commentId);

  if (!existingComment) {
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment không khả dụng để chỉnh sửa");
  }

  if (existingComment.userId !== userId) {
    throw new AppError(403, "Bạn không có quyền sửa comment này");
  }

  const uniqueMentionedUserIds = await resolveMentionTargets({
    mentionAll,
    mentionedUserIds,
    actorId: userId,
    groupId: existingComment.post?.groupId ?? null,
  });
  await assertMentionedUsersExist(uniqueMentionedUserIds);
  if (existingComment.post?.groupId) {
    await assertMentionedUsersInGroup(
      existingComment.post.groupId,
      uniqueMentionedUserIds,
    );
  }

  const updatedComment = await commentRepo.updateCommentContent(
    commentId,
    content,
    uniqueMentionedUserIds,
  );

  await notifyCommentMentions(
    existingComment.postId,
    commentId,
    userId,
    uniqueMentionedUserIds,
  );

  return await formatCommentResponse(updatedComment);
};

export const deleteCommentService = async ({
  userId,
  commentId,
}: DeleteCommentParams) => {
  const existingComment = await commentRepo.getCommentOwner(commentId);

  if (!existingComment) {
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment đã bị xóa hoặc không khả dụng");
  }

  if (existingComment.userId !== userId) {
    throw new AppError(403, "Bạn không có quyền xóa comment này");
  }

  await commentRepo.deleteCommentWithReplies(commentId);

  return {
    message: "Xóa comment thành công",
    data: {
      id: commentId,
      deleted: true,
    },
  };
};

export const pinCommentService = async ({
  userId,
  commentId,
  isPinned,
}: PinCommentParams) => {
  const existingComment = await commentRepo.getCommentForPin(commentId);

  if (!existingComment) {
    throw new AppError(404, "Bình luận không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Bình luận không khả dụng");
  }

  if (existingComment.parentCommentId !== null) {
    throw new AppError(400, "Chỉ có thể ghim bình luận cấp 1");
  }

  await assertCanPinComment(existingComment.postId, userId);

  await commentRepo.setCommentPinned(
    existingComment.postId,
    commentId,
    isPinned,
  );

  const updatedComment = await commentRepo.getCommentDetail(commentId, userId);

  if (!updatedComment) {
    throw new AppError(404, "Bình luận không tồn tại");
  }

  let formatted = await formatCommentResponse(updatedComment);

  if (existingComment.post?.groupId) {
    const [masked] = await maskGroupCommentAuthors(
      existingComment.post.groupId,
      userId,
      [formatted],
    );
    formatted = masked;
  }

  return formatted;
};
