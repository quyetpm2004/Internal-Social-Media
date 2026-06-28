import { Request, Response } from "express";
import type {
  CommentListQuery,
  CreateCommentInput,
  PinCommentInput,
  ReactCommentInput,
  ReplyCommentInput,
  UpdateCommentInput,
} from "@/modules/comment/comment.schema";
import {
  createCommentService,
  deleteCommentService,
  getCommentRepliesService,
  getPostCommentsService,
  pinCommentService,
  reactCommentService,
  replyCommentService,
  updateCommentService,
} from "@/modules/comment/comment.service";

export async function getPostComments(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  const { page, limit } = req.validated as CommentListQuery;

  const result = await getPostCommentsService({
    userId: req.user!.id,
    postId,
    page,
    limit,
  });

  res.status(200).json({
    message: "Lấy danh sách comment cấp 1 thành công",
    data: result,
  });
}

export async function createComment(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  const body = req.validated as CreateCommentInput;

  const result = await createCommentService({
    userId: req.user!.id,
    postId,
    content: body.content,
    mentionedUserIds: body.mentionedUserIds,
    mentionAll: body.mentionAll,
    isAnonymous: body.isAnonymous,
  });

  res.status(201).json({
    message: "Tạo comment thành công",
    data: result,
  });
}

export async function getCommentReplies(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);
  const { page, limit } = req.validated as CommentListQuery;

  const result = await getCommentRepliesService({
    userId: req.user!.id,
    commentId,
    page,
    limit,
  });

  res.status(200).json({
    message: "Lấy danh sách replies thành công",
    data: result,
  });
}

export async function replyComment(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);
  const body = req.validated as ReplyCommentInput;

  const result = await replyCommentService({
    userId: req.user!.id,
    parentCommentId: commentId,
    content: body.content,
    mentionedUserIds: body.mentionedUserIds,
    mentionAll: body.mentionAll,
    isAnonymous: body.isAnonymous,
  });

  res.status(201).json({
    message: "Reply comment thành công",
    data: result,
  });
}

export async function reactComment(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);
  const { reactionType } = req.validated as ReactCommentInput;

  const result = await reactCommentService({
    userId: req.user!.id,
    commentId,
    reactionType,
  });

  res.status(200).json({
    message: result.message,
    data: result.data,
  });
}

export async function updateComment(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);
  const body = req.validated as UpdateCommentInput;

  const result = await updateCommentService({
    userId: req.user!.id,
    commentId,
    content: body.content,
    mentionedUserIds: body.mentionedUserIds,
    mentionAll: body.mentionAll,
  });

  res.status(200).json({
    message: "Cập nhật comment thành công",
    data: result,
  });
}

export async function deleteComment(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);

  const result = await deleteCommentService({
    userId: req.user!.id,
    commentId,
  });

  res.status(200).json({
    message: result.message,
    data: result.data,
  });
}

export async function pinComment(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);
  const { isPinned } = req.validated as PinCommentInput;

  const result = await pinCommentService({
    userId: req.user!.id,
    commentId,
    isPinned,
  });

  res.status(200).json({
    message: isPinned
      ? "Ghim bình luận thành công"
      : "Bỏ ghim bình luận thành công",
    data: result,
  });
}
