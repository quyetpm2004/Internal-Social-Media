import { Request, Response } from "express";
import * as taskService from "@/modules/department/department-task.service";
import type { CreateProjectTaskCommentInput } from "@/modules/project/project.schema";
import type {
  SaveDepartmentTaskConfigInput,
  SaveDepartmentTaskInput,
  UpdateDepartmentTaskStatusInput,
} from "@/modules/department/department-task.schema";

function taskIdOf(req: Request) {
  return Number(req.params.taskId);
}

export async function listTasks(req: Request, res: Response) {
  const data = await taskService.listTasks(req.user!.id);
  res.status(200).json({
    message: "Lấy danh sách công việc phòng ban thành công",
    data,
  });
}

export async function getTask(req: Request, res: Response) {
  const data = await taskService.getTask(req.user!.id, taskIdOf(req));
  res.status(200).json({ message: "Lấy công việc thành công", data });
}

export async function createTask(req: Request, res: Response) {
  const data = await taskService.createTask(
    req.user!.id,
    req.validated as SaveDepartmentTaskInput,
  );
  res.status(201).json({ message: "Tạo công việc thành công", data });
}

export async function updateTask(req: Request, res: Response) {
  const data = await taskService.updateTask(
    req.user!.id,
    taskIdOf(req),
    req.validated as SaveDepartmentTaskInput,
  );
  res.status(200).json({ message: "Cập nhật công việc thành công", data });
}

export async function updateTaskStatus(req: Request, res: Response) {
  const data = await taskService.updateTaskStatus(
    req.user!.id,
    taskIdOf(req),
    req.validated as UpdateDepartmentTaskStatusInput,
  );
  res.status(200).json({ message: "Cập nhật trạng thái thành công", data });
}

export async function deleteTask(req: Request, res: Response) {
  const data = await taskService.deleteTask(req.user!.id, taskIdOf(req));
  res.status(200).json({ message: "Xóa công việc thành công", data });
}

export async function getTaskConfig(req: Request, res: Response) {
  const data = await taskService.getTaskConfig(req.user!.id);
  res.status(200).json({ message: "Lấy cấu hình công việc thành công", data });
}

export async function saveTaskConfig(req: Request, res: Response) {
  const data = await taskService.saveTaskConfig(
    req.user!.id,
    req.validated as SaveDepartmentTaskConfigInput,
  );
  res.status(200).json({ message: "Lưu cấu hình công việc thành công", data });
}

export async function listTaskComments(req: Request, res: Response) {
  const data = await taskService.listTaskComments(req.user!.id, taskIdOf(req));
  res.status(200).json({ message: "Lấy bình luận thành công", data });
}

export async function listTaskAttachments(req: Request, res: Response) {
  const data = await taskService.listTaskAttachments(
    req.user!.id,
    taskIdOf(req),
  );
  res.status(200).json({ message: "Lấy tệp đính kèm thành công", data });
}

export async function createTaskComment(req: Request, res: Response) {
  const data = await taskService.createTaskComment(
    req.user!.id,
    taskIdOf(req),
    req.validated as CreateProjectTaskCommentInput,
  );
  res.status(201).json({ message: "Gửi bình luận thành công", data });
}
