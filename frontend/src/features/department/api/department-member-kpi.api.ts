import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  DepartmentKpi,
  KpiQueryParams,
  MemberKpiResponse,
} from "@/features/department/types/department.type";
import type { KpiPeriod } from "@/features/work/types/kpi.type";

export const departmentMemberKpiApi = {
  getMemberKpi(userId: number, period: KpiPeriod) {
    return axiosClient.get<ApiResponse<MemberKpiResponse>>(
      `/kpi/department/members/${userId}`,
      { params: { period } },
    );
  },

  getDepartmentKpi(params: KpiQueryParams) {
    return axiosClient.get<ApiResponse<DepartmentKpi>>(
      "/kpi/department/members",
      { params },
    );
  },
};
