import { MessageContentType } from "@prisma/client";
import { z } from "zod";
import { CHAT_DEFAULTS } from "@/modules/chat/chat.types";
import { pollInputSchema } from "@/modules/poll/poll.schema";

export const listConversationsQuerySchema = z.object({
  filter: z.enum(["ALL", "UNREAD", "GROUPS"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createDirectConversationSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const createGroupConversationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  memberIds: z.array(z.coerce.number().int().positive()).min(1),
});

export const conversationIdParamsSchema = z.object({
  conversationId: z.coerce.number().int().positive("conversationId không hợp lệ"),
});

export const conversationUserIdParamsSchema = z.object({
  conversationId: z.coerce.number().int().positive("ID cuộc trò chuyện không hợp lệ"),
  userId: z.coerce.number().int().positive("ID người dùng không hợp lệ"),
});

export const listMessagesQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(CHAT_DEFAULTS.MAX_MESSAGES_PER_PAGE)
    .default(CHAT_DEFAULTS.DEFAULT_MESSAGES_PER_PAGE),
});

export const sendMessageSchema = z
  .object({
    content: z.string().max(CHAT_DEFAULTS.MAX_MESSAGE_LENGTH).optional().default(""),
    contentType: z
      .enum([
        MessageContentType.TEXT,
        MessageContentType.IMAGE,
        MessageContentType.FILE,
        MessageContentType.POLL,
      ])
      .default(MessageContentType.TEXT),
    attachmentIds: z.array(z.coerce.number().int().positive()).optional(),
    poll: pollInputSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const trimmed = data.content.trim();
    const hasAttachments = (data.attachmentIds?.length ?? 0) > 0;

    if (data.contentType === MessageContentType.POLL) {
      if (!data.poll) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thiếu thông tin bình chọn",
          path: ["poll"],
        });
      }
      return;
    }

    if (data.contentType === MessageContentType.TEXT && !trimmed && !hasAttachments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nội dung tin nhắn không được để trống",
        path: ["content"],
      });
    }
  });

export const editMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .max(CHAT_DEFAULTS.MAX_MESSAGE_LENGTH),
});

export const messageIdParamsSchema = z.object({
  messageId: z.coerce.number().int().positive("messageId không hợp lệ"),
});

export const muteSchema = z.object({
  muted: z.boolean(),
});

export const sharedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

export const presenceQuerySchema = z.object({
  userIds: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id) && id > 0),
    )
    .pipe(z.array(z.number().int().positive()).max(100)),
});

export const chatSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(255),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const chatSearchHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const addChatSearchHistorySchema = z.object({
  targetUserId: z.coerce.number().int().positive(),
});

export const historyIdParamsSchema = z.object({
  historyId: z.coerce.number().int().positive("ID lịch sử không hợp lệ"),
});

export const addGroupMembersSchema = z.object({
  userIds: z.array(z.coerce.number().int().positive()).min(1),
});

export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type CreateDirectConversationInput = z.infer<
  typeof createDirectConversationSchema
>;
export type CreateGroupConversationInput = z.infer<
  typeof createGroupConversationSchema
>;
export type ConversationIdParams = z.infer<typeof conversationIdParamsSchema>;
export type ConversationUserIdParams = z.infer<
  typeof conversationUserIdParamsSchema
>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type MessageIdParams = z.infer<typeof messageIdParamsSchema>;
export type MuteInput = z.infer<typeof muteSchema>;
export type SharedQuery = z.infer<typeof sharedQuerySchema>;
export type PresenceQuery = z.infer<typeof presenceQuerySchema>;
export type ChatSearchQuery = z.infer<typeof chatSearchQuerySchema>;
export type ChatSearchHistoryQuery = z.infer<
  typeof chatSearchHistoryQuerySchema
>;
export type AddChatSearchHistoryInput = z.infer<
  typeof addChatSearchHistorySchema
>;
export type HistoryIdParams = z.infer<typeof historyIdParamsSchema>;
export type AddGroupMembersInput = z.infer<typeof addGroupMembersSchema>;
