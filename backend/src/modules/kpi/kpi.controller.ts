import { Request, Response } from "express";
import type { KpiMemberQuery, KpiQuery } from "@/modules/kpi/kpi.schema";
import * as kpiService from "@/modules/kpi/kpi.service";
import * as kpiDepartmentService from "@/modules/kpi/kpi-department.service";

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
    req.user!.id,
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
    req.user!.id,
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
    req.user!.id,
    query.period,
  );

  res.status(200).json({
    message: "Lấy tổng quan phòng ban thành công",
    data: result,
  });
}
