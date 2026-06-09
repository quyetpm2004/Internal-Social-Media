import { Request, Response } from "express";
import * as departmentService from "@/modules/department/department.service";

export async function getAllDepartments(_req: Request, res: Response) {
  const departments = await departmentService.getAllDepartments();

  res.status(200).json({
    message: "Get all departments successfully",
    data: departments,
  });
}
