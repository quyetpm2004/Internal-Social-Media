import { axiosClient } from "@/lib/axios";
import { kpiApiBase } from "@/features/department/context/department-scope";
import type { ApiResponse } from "@/types/api.type";
import type {
  DepartmentOverview,
  OverviewPeriod,
} from "@/features/department/types/department.type";

export const departmentOverviewApi = {
  getOverview(period: OverviewPeriod) {
    return axiosClient.get<ApiResponse<DepartmentOverview>>(
      `${kpiApiBase()}/overview`,
      { params: { period } },
    );
  },
};
