import { Prisma } from "@prisma/client";
import { pollInclude } from "@/modules/poll/poll.types";

export const CHAT_DEFAULTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_MESSAGES_PER_PAGE: 100,
  DEFAULT_MESSAGES_PER_PAGE: 30,
  SIGNED_URL_TTL_SECONDS: 60 * 60,
} as const;

export const memberInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: {
        select: {
          avatarKey: true,
        },
      },
    },
  },
} satisfies Prisma.ConversationMemberInclude;

export const messageInclude = {
  sender: {
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: {
        select: {
          avatarKey: true,
        },
      },
    },
  },
  attachments: true,
  poll: {
    include: pollInclude,
  },
} satisfies Prisma.MessageInclude;

export type MessageWithIncludes = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

export type MemberWithUser = Prisma.ConversationMemberGetPayload<{
  include: typeof memberInclude;
}>;
