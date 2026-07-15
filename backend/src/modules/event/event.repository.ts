import {
  EventAttendanceStatus,
  GroupMemberStatus,
  PostStatus,
  PostVisibility,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";

export function findEventsBetween(
  userId: number,
  start: Date,
  end: Date,
  limit: number,
) {
  return prisma.event.findMany({
    where: {
      startAt: {
        gte: start,
        lte: end,
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
            select: { groupName: true },
          },
        },
      },
    },
  });
}

export function findEvent(eventId: number) {
  return prisma.event.findUnique({
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
}

export function findMemberInGroup(groupId: number, userId: number) {
  return prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
    select: { status: true },
  });
}

export function saveAttendance(
  eventId: number,
  userId: number,
  status: EventAttendanceStatus,
) {
  return prisma.eventAttendee.upsert({
    where: {
      eventId_userId: { eventId, userId },
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
}

export function listAttendance(eventId: number) {
  return prisma.eventAttendee.findMany({
    where: { eventId },
    select: {
      userId: true,
      status: true,
    },
  });
}

export function listAttendees(eventId: number) {
  return prisma.eventAttendee.findMany({
    where: { eventId },
    orderBy: { respondedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profile: {
            select: { avatarKey: true },
          },
        },
      },
    },
  });
}
