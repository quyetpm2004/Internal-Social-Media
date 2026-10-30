import { useSearchParams } from "react-router-dom";
import type { PeriodKey } from "@/features/work/data/org-overview.mock";

const periods: PeriodKey[] = ["week", "month", "quarter"];

export function useOverviewPeriod() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("period");
  const period = periods.find((item) => item === raw) ?? "week";

  const setPeriod = (next: PeriodKey) => {
    setSearchParams({ period: next }, { replace: true });
  };

  return { period, setPeriod };
}
