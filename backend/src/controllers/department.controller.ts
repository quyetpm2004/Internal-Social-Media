import { Request, Response } from "express";
import * as departmentService from "@/services/department.service";

export async function getAllDepartments(req: Request, res: Response) {
  try {
    const departments = await departmentService.getAllDepartments();
    res
      .status(200)
      .json({ message: "Lấy tất cả phòng ban thành công", data: departments });
  } catch (error) {
    res
      .status(500)
      .json({ message: error instanceof Error ? error.message : "Lỗi server" });
  }
}
