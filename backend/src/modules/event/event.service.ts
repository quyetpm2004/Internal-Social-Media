import { EventAttendanceStatus, GroupMemberStatus, PostStatus, PostVisibility } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";

const buildAttendeeSummary = (
  attendees: Array<{ status: EventAttendanceStatus }>,
) => ({
  going: attendees.filter((a) => a.status === EventAttendanceStatus.GOING).length,
  maybe: attendees.filter((a) => a.status === EventAttendanceStatus.MAYBE).length,
  declined: attendees.filter((a) => a.status === EventAttendanceStatus.DECLINED)
    .length,
});

export const getUpcomingEventsService = async ({
  userId,
  limit = 10,
}: {
  userId: number;
  limit?: number;
}) => {
  const now = new Date();
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const events = await prisma.event.findMany({
    where: {
      startAt: {
        gte: now,
        lte: oneMonthLater,
      },
      post: {
        status: PostStatus.ACTIVE,
        OR: [
          { groupId: null, visibility: PostVisibility.PUBLIC },
          {
            group: {
              members: {
                some: {
                  userId,
                  status: GroupMemberStatus.ACTIVE,
                },
              },
            },
          },
        ],
      },
    },
    orderBy: { startAt: "asc" },
    take: limit,
    include: {
      attendees: {
        select: {
          userId: true,
          status: true,
        },
      },
      post: {
        select: {
          id: true,
          groupId: true,
          group: {
            select: {
              groupName: true,
            },
          },
        },
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    postId: event.postId,
    groupId: event.post.groupId,
    groupName: event.post.group?.groupName ?? null,
    title: event.title,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt ? event.endAt.toISOString() : null,
    location: event.location,
    attendeeSummary: buildAttendeeSummary(event.attendees),
    myResponse:
      event.attendees.find((attendee) => attendee.userId === userId)?.status ??
      null,
  }));
};

const assertCanAccessEvent = async (eventId: number, userId: number) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      post: {
        select: {
          id: true,
          status: true,
          groupId: true,
          visibility: true,
        },
      },
    },
  });

  if (!event) {
    throw new AppError(404, "Sự kiện không tồn tại");
  }

  if (!event.post || event.post.status !== PostStatus.ACTIVE) {
    throw new AppError(400, "Sự kiện không khả dụng");
  }

  if (event.post.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: event.post.groupId, userId },
      },
      select: {
        status: true,
      },
    });

    if (!membership || membership.status !== GroupMemberStatus.ACTIVE) {
      throw new AppError(403, "Bạn không có quyền truy cập sự kiện này");
    }
  }

  return event;
};

export const respondEventService = async ({
  eventId,
  userId,
  status,
}: {
  eventId: number;
  userId: number;
  status: EventAttendanceStatus;
}) => {
  await assertCanAccessEvent(eventId, userId);

  await prisma.eventAttendee.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    update: {
      status,
      respondedAt: new Date(),
    },
    create: {
      eventId,
      userId,
      status,
    },
  });

  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId },
    select: {
      userId: true,
      status: true,
    },
  });

  const myResponse =
    attendees.find((attendee) => attendee.userId === userId)?.status ?? null;

  return {
    myResponse,
    attendeeSummary: buildAttendeeSummary(attendees),
  };
};

export const getEventAttendeesService = async ({
  eventId,
  userId,
}: {
  eventId: number;
  userId: number;
}) => {
  await assertCanAccessEvent(eventId, userId);

  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId },
    orderBy: { respondedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profile: {
            select: {
              avatarKey: true,
            },
          },
        },
      },
    },
  });

  const mapped = await Promise.all(
    attendees.map(async (attendee) => ({
      id: attendee.user.id,
      fullName: attendee.user.fullName,
      status: attendee.status,
      avatarUrl: attendee.user.profile?.avatarKey
        ? await getFileUrl(attendee.user.profile.avatarKey, 60 * 60)
        : null,
    })),
  );

  return {
    attendees: mapped,
    attendeeSummary: buildAttendeeSummary(attendees),
  };
};
