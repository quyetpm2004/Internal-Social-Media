import { Request, Response } from "express";
import * as searchService from "../services/search.service";

export const search = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const data = await searchService.performSearch(userId, req.query);

    return res.status(200).json({
      message: "Tìm kiếm thành công",
      data,
    });
  } catch (error: unknown) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Tìm kiếm thất bại",
    });
  }
};

export const getSearchHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = req.query.limit;
    const histories = await searchService.getSearchHistory(userId, Number(limit) || 10);

    return res.status(200).json({
      message: "Lấy lịch sử tìm kiếm thành công",
      data: histories,
    });
  } catch (error: unknown) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Lấy lịch sử tìm kiếm thất bại",
    });
  }
};

export const addSearchHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const histories = await searchService.addSearchHistory(
      userId,
      req.body?.query,
    );

    return res.status(200).json({
      message: "Lưu lịch sử tìm kiếm thành công",
      data: histories,
    });
  } catch (error: unknown) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Lưu lịch sử tìm kiếm thất bại",
    });
  }
};

export const deleteSearchHistoryItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const historyId = Number(req.params.historyId);
    await searchService.deleteSearchHistoryItem(userId, historyId);

    return res.status(200).json({
      message: "Xóa lịch sử tìm kiếm thành công",
    });
  } catch (error: unknown) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Xóa lịch sử tìm kiếm thất bại",
    });
  }
};

export const clearSearchHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await searchService.clearSearchHistory(userId);

    return res.status(200).json({
      message: "Xóa toàn bộ lịch sử tìm kiếm thành công",
    });
  } catch (error: unknown) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Xóa toàn bộ lịch sử tìm kiếm thất bại",
    });
  }
};
