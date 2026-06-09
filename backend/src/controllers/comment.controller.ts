import { Request, Response, NextFunction } from "express";
import {
  getPostCommentsService,
  getCommentRepliesService,
  createCommentService,
  replyCommentService,
  reactCommentService,
  updateCommentService,
  deleteCommentService,
} from "@/services/comment.service";

export const getPostCommentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: "postId không hợp lệ" });
    }

    const result = await getPostCommentsService({
      userId,
      postId,
      page,
      limit,
    });

    return res.status(200).json({
      message: "Lấy danh sách comment cấp 1 thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCommentRepliesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const commentId = Number(req.params.commentId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ message: "commentId không hợp lệ" });
    }

    const result = await getCommentRepliesService({
      userId,
      commentId,
      page,
      limit,
    });

    return res.status(200).json({
      message: "Lấy danh sách replies thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);
    const { content, mentionedUserIds, isAnonymous } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: "postId không hợp lệ" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Nội dung comment không được để trống",
      });
    }

    const result = await createCommentService({
      userId,
      postId,
      content: content.trim(),
      mentionedUserIds: Array.isArray(mentionedUserIds) ? mentionedUserIds : [],
      isAnonymous: isAnonymous === true,
    });

    return res.status(201).json({
      message: "Tạo comment thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const replyCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const commentId = Number(req.params.commentId);
    const { content, mentionedUserIds, isAnonymous } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ message: "commentId không hợp lệ" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Nội dung reply không được để trống",
      });
    }

    const result = await replyCommentService({
      userId,
      parentCommentId: commentId,
      content: content.trim(),
      mentionedUserIds: Array.isArray(mentionedUserIds) ? mentionedUserIds : [],
      isAnonymous: isAnonymous === true,
    });

    return res.status(201).json({
      message: "Reply comment thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const reactCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const commentId = Number(req.params.commentId);
    const { reactionType } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập hoặc token không hợp lệ",
      });
    }

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({
        message: "commentId không hợp lệ",
      });
    }

    const allowedReactionTypes = [
      "LIKE",
      "LOVE",
      "HAHA",
      "WOW",
      "SAD",
      "ANGRY",
    ];

    if (!reactionType || !allowedReactionTypes.includes(reactionType)) {
      return res.status(400).json({
        message: "reactionType không hợp lệ",
      });
    }

    const result = await reactCommentService({
      userId,
      commentId,
      reactionType,
    });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const commentId = Number(req.params.commentId);
    const { content, mentionedUserIds, isAnonymous } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ message: "commentId không hợp lệ" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Nội dung comment không được để trống",
      });
    }

    const result = await updateCommentService({
      userId,
      commentId,
      content: content.trim(),
      mentionedUserIds: Array.isArray(mentionedUserIds) ? mentionedUserIds : [],
    });

    return res.status(200).json({
      message: "Cập nhật comment thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const commentId = Number(req.params.commentId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ message: "commentId không hợp lệ" });
    }

    const result = await deleteCommentService({
      userId,
      commentId,
    });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};
