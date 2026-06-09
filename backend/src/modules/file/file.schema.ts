import { z } from "zod";

export const getFileUrlQuerySchema = z.object({
  key: z.string().trim().min(1, "Key is required"),
});

export type GetFileUrlQuery = z.infer<typeof getFileUrlQuerySchema>;
