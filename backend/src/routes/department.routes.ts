import { Router } from "express";
import * as departmentController from "../controllers/department.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, departmentController.getAllDepartments);

export default router;
