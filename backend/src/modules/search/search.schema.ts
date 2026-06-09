import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(["all", "people", "groups"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const searchHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

export const addSearchHistorySchema = z.object({
  query: z.string().trim().min(1).max(255, "Từ khóa tìm kiếm không hợp lệ"),
});

export const historyIdParamsSchema = z.object({
  historyId: z.coerce.number().int().positive("ID lịch sử không hợp lệ"),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchHistoryQuery = z.infer<typeof searchHistoryQuerySchema>;
export type AddSearchHistoryInput = z.infer<typeof addSearchHistorySchema>;
export type HistoryIdParams = z.infer<typeof historyIdParamsSchema>;
