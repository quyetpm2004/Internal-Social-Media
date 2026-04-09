import { Router } from "express";
import * as positionController from "../controllers/position.controller";

const router = Router();

router.get("/", positionController.getAllPositions);

export default router;
