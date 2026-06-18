import { EventAttendanceStatus } from "@prisma/client";
import { z } from "zod";

export const eventIdParamsSchema = z.object({
  eventId: z.coerce.number().int().positive("eventId không hợp lệ"),
});

export const respondEventSchema = z.object({
  status: z.enum([
    EventAttendanceStatus.GOING,
    EventAttendanceStatus.MAYBE,
    EventAttendanceStatus.DECLINED,
  ]),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
export type RespondEventInput = z.infer<typeof respondEventSchema>;
