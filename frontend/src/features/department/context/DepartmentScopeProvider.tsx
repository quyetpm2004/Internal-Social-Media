import { useLayoutEffect, type ReactNode } from "react";
import {
  DepartmentScopeContext,
  setActiveDepartmentRef,
  type DepartmentScope,
} from "@/features/department/context/department-scope";

/**
 * Cho các trang con biết đang xem phòng nào. useLayoutEffect chạy trước mọi useEffect
 * (kể cả của trang con), nên các lời gọi API đầu tiên đã trỏ đúng phòng.
 */
export default function DepartmentScopeProvider({
  value,
  children,
}: {
  value: DepartmentScope;
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    setActiveDepartmentRef(value.ref);
    return () => setActiveDepartmentRef("me");
  }, [value.ref]);

  return (
    <DepartmentScopeContext.Provider value={value}>
      {children}
    </DepartmentScopeContext.Provider>
  );
}
