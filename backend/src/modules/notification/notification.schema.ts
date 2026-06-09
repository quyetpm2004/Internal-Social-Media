import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const notificationIdParamsSchema = z.object({
  notificationId: z.coerce
    .number()
    .int()
    .positive("notificationId không hợp lệ"),
});

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;
