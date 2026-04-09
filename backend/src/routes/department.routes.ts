import { Router } from "express";
import * as departmentController from "../controllers/department.controller";

const router = Router();

router.get("/", departmentController.getAllDepartments);

export default router;
