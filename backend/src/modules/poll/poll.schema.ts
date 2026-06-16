import { z } from "zod";

export const pollInputSchema = z.object({
  question: z.string().trim().min(1, "Câu hỏi bình chọn không được để trống").max(500),
  options: z
    .array(z.string().trim().min(1, "Lựa chọn không được để trống").max(200))
    .min(2, "Cần ít nhất 2 lựa chọn")
    .max(10, "Tối đa 10 lựa chọn"),
  allowMultiple: z.boolean().optional().default(false),
});

export const votePollSchema = z.object({
  optionIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Chọn ít nhất một lựa chọn"),
});

export const pollIdParamsSchema = z.object({
  pollId: z.coerce.number().int().positive("pollId không hợp lệ"),
});

export type PollInput = z.infer<typeof pollInputSchema>;
export type VotePollInput = z.infer<typeof votePollSchema>;
