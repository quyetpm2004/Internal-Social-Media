import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type { KpiPeriod } from "@/features/work/types/kpi.type";

/** Cơ cấu tổ chức: Giám đốc quản lý phòng ban, bổ nhiệm trưởng phòng, chuyển nhân sự. */

export type OrgDepartment = {
  id: number;
  name: string;
  description: string | null;
  manager: { id: number; fullName: string; email: string } | null;
  _count: { users: number };
};

export type SaveOrgDepartmentPayload = {
  name: string;
  description: string | null;
};

export type Appointee = {
  id: number;
  name: string;
  email: string;
  department: { id: number; name: string } | null;
  position: { id: number; name: string } | null;
};

export type OrgMember = {
  id: number;
  name: string;
  email: string;
  position: { id: number; name: string } | null;
  isLeader: boolean;
};

type Paginated<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export const departmentOrgApi = {
  list() {
    return axiosClient.get<ApiResponse<OrgDepartment[]>>("/departments");
  },

  create(payload: SaveOrgDepartmentPayload) {
    return axiosClient.post<ApiResponse<OrgDepartment>>("/departments", payload);
  },

  update(id: number, payload: Partial<SaveOrgDepartmentPayload>) {
    return axiosClient.patch<ApiResponse<OrgDepartment>>(
      `/departments/${id}`,
      payload,
    );
  },

  remove(id: number) {
    return axiosClient.delete<ApiResponse<null>>(`/departments/${id}`);
  },

  listAppointees(params: { search?: string; page?: number; limit?: number }) {
    return axiosClient.get<ApiResponse<Paginated<Appointee>>>(
      "/departments/appointees",
      { params },
    );
  },

  appointManager(id: number, userId: number) {
    return axiosClient.put<ApiResponse<OrgDepartment>>(
      `/departments/${id}/manager`,
      { userId },
    );
  },

  dismissManager(id: number) {
    return axiosClient.delete<ApiResponse<OrgDepartment>>(
      `/departments/${id}/manager`,
    );
  },

  listMembers(id: number) {
    return axiosClient.get<ApiResponse<Paginated<OrgMember>>>(
      `/departments/${id}/members`,
      { params: { page: 1, limit: 50 } },
    );
  },

  transferMember(id: number, userId: number, toDepartmentId: number) {
    return axiosClient.post<ApiResponse<OrgMember>>(
      `/departments/${id}/members/${userId}/transfer`,
      { toDepartmentId },
    );
  },
};

export type OrganizationKpi = {
  period: KpiPeriod;
  summary: {
    departmentCount: number;
    memberCount: number;
    assigned: number;
    done: number;
    late: number;
    completionRate: number | null;
    onTimeRate: number | null;
    score: number | null;
    previousScore: number | null;
  };
  departments: Array<{
    id: number;
    name: string;
    manager: { id: number; fullName: string } | null;
    memberCount: number;
    assigned: number;
    done: number;
    late: number;
    completionRate: number | null;
    onTimeRate: number | null;
    score: number | null;
    previousScore: number | null;
  }>;
  topDepartments: number[];
  needSupport: number[];
};

export const organizationKpiApi = {
  overview(period: KpiPeriod) {
    return axiosClient.get<ApiResponse<OrganizationKpi>>(
      "/kpi/organization/overview",
      { params: { period } },
    );
  },
};
