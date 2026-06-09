import { Request, Response } from "express";
import type {
  AddSearchHistoryInput,
  HistoryIdParams,
  SearchHistoryQuery,
  SearchQuery,
} from "@/modules/search/search.schema";
import * as searchService from "@/modules/search/search.service";

export async function search(req: Request, res: Response) {
  const params = req.validated as SearchQuery;

  const data = await searchService.performSearch(req.user!.id, params);

  res.status(200).json({
    message: "Tìm kiếm thành công",
    data,
  });
}

export async function getSearchHistory(req: Request, res: Response) {
  const { limit } = req.validated as SearchHistoryQuery;

  const histories = await searchService.getSearchHistory(req.user!.id, limit);

  res.status(200).json({
    message: "Lấy lịch sử tìm kiếm thành công",
    data: histories,
  });
}

export async function addSearchHistory(req: Request, res: Response) {
  const { query } = req.validated as AddSearchHistoryInput;

  const histories = await searchService.addSearchHistory(req.user!.id, query);

  res.status(200).json({
    message: "Lưu lịch sử tìm kiếm thành công",
    data: histories,
  });
}

export async function deleteSearchHistoryItem(req: Request, res: Response) {
  const { historyId } = req.validated as HistoryIdParams;

  await searchService.deleteSearchHistoryItem(req.user!.id, historyId);

  res.status(200).json({
    message: "Xóa lịch sử tìm kiếm thành công",
  });
}

export async function clearSearchHistory(req: Request, res: Response) {
  await searchService.clearSearchHistory(req.user!.id);

  res.status(200).json({
    message: "Xóa toàn bộ lịch sử tìm kiếm thành công",
  });
}
