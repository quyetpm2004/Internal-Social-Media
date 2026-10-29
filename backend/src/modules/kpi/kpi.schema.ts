import { z } from "zod";

export const kpiQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter"]).default("month"),
});

export type KpiQuery = z.infer<typeof kpiQuerySchema>;
export type KpiPeriod = KpiQuery["period"];
