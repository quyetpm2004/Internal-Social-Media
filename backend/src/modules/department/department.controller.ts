import { Request, Response } from "express";
import { AppError } from "@/shared/errors/app-error";
import * as departmentService from "@/modules/department/department.service";
import * as memberService from "@/modules/department/department-member.service";
import type {
  AddMemberInput,
  AppointManagerInput,
  AppointeeListQuery,
  CandidateListQuery,
  CreateDepartmentInput,
  MemberListQuery,
  MemberTaskListQuery,
  TransferMemberInput,
  UpdateDepartmentInput,
  UpdateMemberInput,
} from "@/modules/department/department.schema";

function positiveParam(req: Request, name: string) {
  const value = Number(req.params[name]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError(400, `${name} không hợp lệ`);
  }
  return value;
}

const memberIdOf = (req: Request) => positiveParam(req, "userId");

export function departmentIdOf(req: Request) {
  if (req.params.departmentId !== undefined) {
    return positiveParam(req, "departmentId");
  }
  const own = req.user!.departmentId;
  if (own === null) {
    throw new AppError(404, "Bạn chưa thuộc phòng ban nào");
  }
  return own;
}

export async function getAllDepartments(_req: Request, res: Response) {
  const departments = await departmentService.getAllDepartments();

  res.status(200).json({
    message: "Get all departments successfully",
    data: departments,
  });
}

// ─── Cơ cấu tổ chức (Giám đốc) ───────────────────────────────────────────────

export async function createDepartment(req: Request, res: Response) {
  const department = await departmentService.createDepartment(
    req.validated as CreateDepartmentInput,
  );

  res.status(201).json({
    message: "Tạo phòng ban thành công",
    data: department,
  });
}

export async function updateDepartment(req: Request, res: Response) {
  const department = await departmentService.updateDepartment(
    positiveParam(req, "departmentId"),
    req.validated as UpdateDepartmentInput,
  );

  res.status(200).json({
    message: "Cập nhật phòng ban thành công",
    data: department,
  });
}

export async function deleteDepartment(req: Request, res: Response) {
  await departmentService.deleteDepartment(positiveParam(req, "departmentId"));

  res.status(200).json({ message: "Xóa phòng ban thành công" });
}

export async function listAppointees(req: Request, res: Response) {
  const result = await departmentService.listAppointees(
    req.validated as AppointeeListQuery,
  );

  res.status(200).json({
    message: "Lấy danh sách người có thể bổ nhiệm thành công",
    data: result,
  });
}

export async function appointManager(req: Request, res: Response) {
  const department = await departmentService.appointManager(
    positiveParam(req, "departmentId"),
    req.validated as AppointManagerInput,
  );

  res.status(200).json({
    message: "Bổ nhiệm trưởng phòng thành công",
    data: department,
  });
}

export async function dismissManager(req: Request, res: Response) {
  const department = await departmentService.dismissManager(
    positiveParam(req, "departmentId"),
  );

  res.status(200).json({
    message: "Miễn nhiệm trưởng phòng thành công",
    data: department,
  });
}

// ─── Nhân sự phòng ban ───────────────────────────────────────────────────────

export async function listMembers(req: Request, res: Response) {
  const result = await memberService.listMembers(
    req.user!,
    departmentIdOf(req),
    req.validated as MemberListQuery,
  );

  res.status(200).json({
    message: "Lấy danh sách nhân sự thành công",
    data: result,
  });
}

export async function listMemberTasks(req: Request, res: Response) {
  const result = await memberService.listMemberTasks(
    req.user!,
    departmentIdOf(req),
    memberIdOf(req),
    req.validated as MemberTaskListQuery,
  );

  res.status(200).json({
    message: "Lấy công việc của nhân viên thành công",
    data: result,
  });
}

export async function listProjects(req: Request, res: Response) {
  const result = await memberService.listProjects(
    req.user!,
    departmentIdOf(req),
  );

  res.status(200).json({
    message: "Lấy danh sách dự án của phòng ban thành công",
    data: result,
  });
}

export async function listCandidates(req: Request, res: Response) {
  const result = await memberService.listCandidates(
    req.user!,
    departmentIdOf(req),
    req.validated as CandidateListQuery,
  );

  res.status(200).json({
    message: "Lấy danh sách người dùng chưa có phòng ban thành công",
    data: result,
  });
}

export async function addMember(req: Request, res: Response) {
  const member = await memberService.addMember(
    req.user!,
    departmentIdOf(req),
    req.validated as AddMemberInput,
  );

  res.status(201).json({
    message: "Thêm thành viên thành công",
    data: member,
  });
}

export async function updateMember(req: Request, res: Response) {
  const member = await memberService.updateMember(
    req.user!,
    departmentIdOf(req),
    memberIdOf(req),
    req.validated as UpdateMemberInput,
  );

  res.status(200).json({
    message: "Cập nhật thành viên thành công",
    data: member,
  });
}

export async function removeMember(req: Request, res: Response) {
  await memberService.removeMember(
    req.user!,
    departmentIdOf(req),
    memberIdOf(req),
  );

  res.status(200).json({ message: "Xóa thành viên thành công" });
}

export async function transferMember(req: Request, res: Response) {
  const member = await memberService.transferMember(
    req.user!,
    positiveParam(req, "departmentId"),
    memberIdOf(req),
    req.validated as TransferMemberInput,
  );

  res.status(200).json({
    message: "Chuyển phòng ban thành công",
    data: member,
  });
}
