import { Request, Response } from "express";
import { AppError } from "@/shared/errors/app-error";
import type { KpiMemberQuery, KpiQuery } from "@/modules/kpi/kpi.schema";
import * as kpiService from "@/modules/kpi/kpi.service";
import * as kpiDepartmentService from "@/modules/kpi/kpi-department.service";

function departmentIdOf(req: Request) {
  if (req.params.departmentId !== undefined) {
    const id = Number(req.params.departmentId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(400, "departmentId không hợp lệ");
    }
    return id;
  }
  const own = req.user!.departmentId;
  if (own === null) {
    throw new AppError(404, "Bạn chưa thuộc phòng ban nào");
  }
  return own;
}

export async function getMyKpi(req: Request, res: Response) {
  const query = req.validated as KpiQuery;
  const result = await kpiService.getMyKpi(req.user!.id, query.period);

  res.status(200).json({
    message: "Lấy KPI nhân viên thành công",
    data: result,
  });
}

export async function getDepartmentKpi(req: Request, res: Response) {
  const query = req.validated as KpiMemberQuery;
  const result = await kpiDepartmentService.getDepartmentKpi(
    req.user!,
    departmentIdOf(req),
    query,
  );

  res.status(200).json({
    message: "Lấy KPI nhân viên phòng ban thành công",
    data: result,
  });
}

export async function getMemberKpi(req: Request, res: Response) {
  const query = req.validated as KpiQuery;
  const result = await kpiDepartmentService.getMemberKpi(
    req.user!,
    departmentIdOf(req),
    Number(req.params.userId),
    query.period,
  );

  res.status(200).json({
    message: "Lấy KPI nhân viên thành công",
    data: result,
  });
}

export async function getDepartmentOverview(req: Request, res: Response) {
  const query = req.validated as KpiQuery;
  const result = await kpiDepartmentService.getDepartmentOverview(
    req.user!,
    departmentIdOf(req),
    query.period,
  );

  res.status(200).json({
    message: "Lấy tổng quan phòng ban thành công",
    data: result,
  });
}

export async function getOrganizationOverview(req: Request, res: Response) {
  const query = req.validated as KpiQuery;
  const result = await kpiDepartmentService.getOrganizationOverview(
    req.user!,
    query.period,
  );

  res.status(200).json({
    message: "Lấy tổng quan tổ chức thành công",
    data: result,
  });
}
