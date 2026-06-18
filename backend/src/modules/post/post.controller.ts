import { Request, Response } from "express";
import type {
  CreatePostInput,
  PinPostInput,
  PostListQuery,
  ReactPostInput,
  SavedPostListQuery,
  UpdatePostInput,
} from "@/modules/post/post.schema";
import {
  createPostService,
  deletePostService,
  getSavedPostListService,
  getPostById,
  getPostListService,
  pinPostByUserId,
  reactPostService,
  toggleSavePostService,
  updatePostService,
} from "@/modules/post/post.service";

export async function getPostList(req: Request, res: Response) {
  const { page, limit, sort, groupId } = req.validated as PostListQuery;

  const result = await getPostListService({
    userId: req.user!.id,
    page,
    limit,
    sort,
    groupId,
  });

  res.status(200).json({
    message: "Lấy danh sách bài viết thành công",
    data: result,
  });
}

export async function createPost(req: Request, res: Response) {
  const body = req.validated as CreatePostInput;

  const newPost = await createPostService({
    userId: req.user!.id,
    content: body.content ?? "",
    contentFormat: body.contentFormat,
    visibility: body.visibility,
    groupId: body.groupId,
    attachmentIds: body.attachmentIds ?? [],
    isAnonymous: body.isAnonymous,
    poll: body.poll,
    event: body.event,
  });

  res.status(201).json({
    message: "Đăng bài viết thành công",
    data: newPost,
  });
}

export async function updatePost(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  const body = req.validated as UpdatePostInput;

  const updatedPost = await updatePostService({
    userId: req.user!.id,
    postId,
    content: body.content,
    contentFormat: body.contentFormat,
  });

  res.status(200).json({
    message: "Cập nhật bài viết thành công",
    data: updatedPost,
  });
}

export async function reactPost(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  const { reactionType } = req.validated as ReactPostInput;

  const result = await reactPostService({
    userId: req.user!.id,
    postId,
    reactionType,
  });

  res.status(200).json({
    message: result.message,
    data: result.data,
  });
}

export async function deletePost(req: Request, res: Response) {
  const postId = Number(req.params.postId);

  await deletePostService(req.user!.id, postId);

  res.status(200).json({
    message: "Xóa bài viết thành công",
  });
}

export async function getPostByIdHandler(req: Request, res: Response) {
  const postId = Number(req.params.postId);

  const result = await getPostById(postId, req.user!.id);

  res.status(200).json({
    message: "Lấy bài viết thành công",
    data: result,
  });
}

export async function pinPost(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  const { isPinned, groupId } = req.validated as PinPostInput;

  const result = await pinPostByUserId(
    postId,
    req.user!.id,
    groupId ?? null,
    isPinned,
  );

  res.status(201).json({
    message: "Pin/UnPin bài viết thành công",
    data: result,
  });
}

export async function toggleSavePost(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  const result = await toggleSavePostService({
    postId,
    userId: req.user!.id,
  });

  res.status(200).json({
    message: result.isSaved
      ? "Đã lưu bài viết thành công"
      : "Đã bỏ lưu bài viết",
    data: result,
  });
}

export async function getSavedPosts(req: Request, res: Response) {
  const { page, limit } = req.validated as SavedPostListQuery;
  const result = await getSavedPostListService({
    userId: req.user!.id,
    page,
    limit,
  });

  res.status(200).json({
    message: "Lấy danh sách bài viết đã lưu thành công",
    data: result,
  });
}
