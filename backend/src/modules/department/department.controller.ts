import { Request, Response } from "express";
import { AppError } from "@/shared/errors/app-error";
import * as departmentService from "@/modules/department/department.service";
import * as memberService from "@/modules/department/department-member.service";
import type {
  AddMemberInput,
  CandidateListQuery,
  MemberListQuery,
  MemberTaskListQuery,
  UpdateMemberInput,
} from "@/modules/department/department.schema";

function memberIdOf(req: Request) {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError(400, "userId không hợp lệ");
  }
  return userId;
}

export async function getAllDepartments(_req: Request, res: Response) {
  const departments = await departmentService.getAllDepartments();

  res.status(200).json({
    message: "Get all departments successfully",
    data: departments,
  });
}

export async function listMembers(req: Request, res: Response) {
  const result = await memberService.listMembers(
    req.user!.id,
    req.validated as MemberListQuery,
  );

  res.status(200).json({
    message: "Lấy danh sách nhân sự thành công",
    data: result,
  });
}

export async function listMemberTasks(req: Request, res: Response) {
  const result = await memberService.listMemberTasks(
    req.user!.id,
    memberIdOf(req),
    req.validated as MemberTaskListQuery,
  );

  res.status(200).json({
    message: "Lấy công việc của nhân viên thành công",
    data: result,
  });
}

export async function listProjects(req: Request, res: Response) {
  const result = await memberService.listProjects(req.user!.id);

  res.status(200).json({
    message: "Lấy danh sách dự án của phòng ban thành công",
    data: result,
  });
}

export async function listCandidates(req: Request, res: Response) {
  const result = await memberService.listCandidates(
    req.user!.id,
    req.validated as CandidateListQuery,
  );

  res.status(200).json({
    message: "Lấy danh sách người dùng chưa có phòng ban thành công",
    data: result,
  });
}

export async function addMember(req: Request, res: Response) {
  const member = await memberService.addMember(
    req.user!.id,
    req.validated as AddMemberInput,
  );

  res.status(201).json({
    message: "Thêm thành viên thành công",
    data: member,
  });
}

export async function updateMember(req: Request, res: Response) {
  const member = await memberService.updateMember(
    req.user!.id,
    memberIdOf(req),
    req.validated as UpdateMemberInput,
  );

  res.status(200).json({
    message: "Cập nhật thành viên thành công",
    data: member,
  });
}

export async function removeMember(req: Request, res: Response) {
  await memberService.removeMember(req.user!.id, memberIdOf(req));

  res.status(200).json({ message: "Xóa thành viên thành công" });
}
