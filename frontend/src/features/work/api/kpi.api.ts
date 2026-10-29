import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type { KpiPeriod, KpiResponse } from "@/features/work/types/kpi.type";

export const kpiApi = {
  getMyKpi(period: KpiPeriod) {
    return axiosClient.get<ApiResponse<KpiResponse>>("/kpi/me", {
      params: { period },
    });
  },
};
