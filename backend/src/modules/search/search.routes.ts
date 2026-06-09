import { Router } from "express";
import * as searchController from "@/modules/search/search.controller";
import {
  addSearchHistorySchema,
  historyIdParamsSchema,
  searchHistoryQuerySchema,
  searchQuerySchema,
} from "@/modules/search/search.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  validateQuery(searchQuerySchema),
  asyncHandler(searchController.search),
);
router.get(
  "/history",
  authMiddleware,
  validateQuery(searchHistoryQuerySchema),
  asyncHandler(searchController.getSearchHistory),
);
router.post(
  "/history",
  authMiddleware,
  validateBody(addSearchHistorySchema),
  asyncHandler(searchController.addSearchHistory),
);
router.delete(
  "/history",
  authMiddleware,
  asyncHandler(searchController.clearSearchHistory),
);
router.delete(
  "/history/:historyId",
  authMiddleware,
  validateParams(historyIdParamsSchema),
  asyncHandler(searchController.deleteSearchHistoryItem),
);

export default router;
