import { Request, Response, NextFunction } from "express";
import {
  createPostService,
  deletePostService,
  getPostById,
  getPostListService,
  pinPostByUserId,
  reactPostService,
  updatePostService,
} from "../services/post.service";
import { PostContentError } from "../utils/post-content-error";
import z from "zod";

export const getPostListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = (req.query.sort as "latest" | "trending") || "latest";
    const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;

    if (page < 1) {
      return res.status(400).json({
        message: "page phải lớn hơn hoặc bằng 1",
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        message: "limit phải từ 1 đến 50",
      });
    }

    if (!["latest", "trending"].includes(sort)) {
      return res.status(400).json({
        message: "sort chỉ chấp nhận latest hoặc trending",
      });
    }

    const result = await getPostListService({
      userId,
      page,
      limit,
      sort,
      groupId,
    });

    return res.status(200).json({
      message: "Lấy danh sách bài viết thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const contentFormatSchema = z.enum(["PLAIN", "HTML"]);

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  contentFormat: contentFormatSchema.default("HTML"),
  visibility: z.enum(["PUBLIC", "PRIVATE", "GROUP"]).default("PUBLIC"),
  groupId: z.number().optional(),
  attachmentIds: z.array(z.number()).optional(),
});

const updatePostSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  contentFormat: contentFormatSchema.default("HTML"),
});

function handlePostContentError(error: unknown, res: Response) {
  if (error instanceof PostContentError) {
    return res.status(400).json({ message: error.message });
  }
  return null;
}

export const createPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }

    const body = createPostSchema.parse(req.body);

    const newPost = await createPostService({
      userId,
      content: body.content,
      contentFormat: body.contentFormat,
      visibility: body.visibility,
      groupId: body.groupId,
      attachmentIds: body.attachmentIds || [],
    });

    return res.status(201).json({
      message: "Đăng bài viết thành công",
      data: newPost,
    });
  } catch (error) {
    if (handlePostContentError(error, res)) return;
    next(error);
  }
};

export const updatePostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }

    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "postId không hợp lệ",
      });
    }

    const body = updatePostSchema.parse(req.body);

    const updatedPost = await updatePostService({
      userId,
      postId,
      content: body.content,
      contentFormat: body.contentFormat,
    });

    return res.status(200).json({
      message: "Cập nhật bài viết thành công",
      data: updatedPost,
    });
  } catch (error: any) {
    if (handlePostContentError(error, res)) return;

    if (error?.message?.includes("không có quyền")) {
      return res.status(403).json({ message: error.message });
    }

    if (error?.message?.includes("không tồn tại")) {
      return res.status(404).json({ message: error.message });
    }

    next(error);
  }
};

export const reactPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);
    const { reactionType } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập hoặc token không hợp lệ",
      });
    }

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "postId không hợp lệ",
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

    const result = await reactPostService({
      userId,
      postId,
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

export const deletePostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);

    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }

    const result = await deletePostService(userId, postId);

    if (result)
      return res.status(200).json({
        message: "Xóa bài viết thành công",
      });
  } catch (error) {
    next(error);
  }
};

export const getPostByIdController = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);
    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }
    const result = await getPostById(postId, userId);
    if (result) {
      return res.status(200).json({
        message: "Lấy bài viết thành công",
        data: result,
      });
    }
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const pinPostByUserIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);
    const { isPinned, groupId } = req.body;
    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }
    const result = await pinPostByUserId(postId, userId, groupId, isPinned);
    if (result) {
      return res.status(201).json({
        message: "Pin/UnPin bài viết thành công",
        data: result,
      });
    }
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
