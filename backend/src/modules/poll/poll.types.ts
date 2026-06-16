import { Prisma } from "@prisma/client";

export const pollInclude = {
  options: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      _count: {
        select: { votes: true },
      },
      votes: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  },
  votes: {
    select: {
      optionId: true,
      userId: true,
    },
  },
} satisfies Prisma.PollInclude;

export type PollWithIncludes = Prisma.PollGetPayload<{
  include: typeof pollInclude;
}>;

export type PollSummary = {
  id: number;
  question: string;
  allowMultiple: boolean;
  endsAt: string | null;
  status: string;
  totalVotes: number;
  options: {
    id: number;
    label: string;
    voteCount: number;
    voters: {
      id: number;
      fullName: string;
    }[];
  }[];
  myVotes: number[];
};

export const getPollInclude = (userId: number) => ({
  include: {
    options: {
      orderBy: { sortOrder: "asc" as const },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    },
    votes: {
      where: { userId },
      select: {
        optionId: true,
        userId: true,
      },
    },
  },
});
