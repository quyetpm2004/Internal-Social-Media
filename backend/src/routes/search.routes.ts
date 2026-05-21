import { Router } from "express";
import * as searchController from "../controllers/search.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, searchController.search);
router.get("/history", authMiddleware, searchController.getSearchHistory);
router.post("/history", authMiddleware, searchController.addSearchHistory);
router.delete("/history", authMiddleware, searchController.clearSearchHistory);
router.delete(
  "/history/:historyId",
  authMiddleware,
  searchController.deleteSearchHistoryItem,
);

export default router;
