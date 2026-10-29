import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  DepartmentOverview,
  OverviewPeriod,
} from "@/features/department/types/department.type";

export const departmentOverviewApi = {
  getOverview(period: OverviewPeriod) {
    return axiosClient.get<ApiResponse<DepartmentOverview>>(
      "/kpi/department/overview",
      { params: { period } },
    );
  },
};
