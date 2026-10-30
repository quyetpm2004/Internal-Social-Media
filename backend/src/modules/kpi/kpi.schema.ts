import { z } from "zod";

export const kpiQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter"]).default("month"),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

export const kpiMemberQuerySchema = z
  .object({
    period: z.enum(["week", "month", "custom"]).default("month"),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.period !== "custom") return;
    if (!value.from || !value.to) {
      ctx.addIssue({
        code: "custom",
        message: "Cần chọn khoảng thời gian",
        path: ["from"],
      });
      return;
    }
    if (value.from > value.to) {
      ctx.addIssue({
        code: "custom",
        message: "Ngày bắt đầu phải trước ngày kết thúc",
        path: ["from"],
      });
    }
  });

export type KpiQuery = z.infer<typeof kpiQuerySchema>;
export type KpiMemberQuery = z.infer<typeof kpiMemberQuerySchema>;
export type KpiPeriod = KpiQuery["period"];
