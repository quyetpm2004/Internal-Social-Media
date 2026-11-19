import { createContext, useContext } from "react";

/**
 * Phòng ban mà các trang phòng ban đang xem.
 * - "me": phòng của chính người dùng (Manager quản lý, Employee chỉ đọc).
 * - số: Giám đốc xem một phòng bất kỳ (chỉ đọc).
 */
export type DepartmentRef = "me" | number;

export type DepartmentScope = {
  ref: DepartmentRef;
  /** Tiền tố đường dẫn giao diện của các trang con (members, tasks, kpi). */
  basePath: string;
  readOnly: boolean;
};

export const defaultDepartmentScope: DepartmentScope = {
  ref: "me",
  basePath: "/work/department",
  readOnly: false,
};

// Các hàm API đọc phòng đang xem tại thời điểm gọi, nên các trang không phải truyền id qua từng lời gọi.
// DepartmentScopeProvider đặt biến này trong useLayoutEffect, chạy trước mọi effect tải dữ liệu của trang con.
let activeRef: DepartmentRef = "me";

export function setActiveDepartmentRef(ref: DepartmentRef) {
  activeRef = ref;
}

export function departmentApiBase() {
  return activeRef === "me" ? "/departments/me" : `/departments/${activeRef}`;
}

export function kpiApiBase() {
  return activeRef === "me" ? "/kpi/department" : `/kpi/departments/${activeRef}`;
}

export const DepartmentScopeContext = createContext<DepartmentScope>(
  defaultDepartmentScope,
);

export function useDepartmentScope() {
  return useContext(DepartmentScopeContext);
}
