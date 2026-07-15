import {
  EventAttendanceStatus,
  GroupMemberStatus,
  PostStatus,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getFileUrl } from "@/modules/file/file.service";
import * as eventRepo from "@/modules/event/event.repository";

const summarizeAttendance = (
  rows: Array<{ status: EventAttendanceStatus }>,
) => ({
  going: rows.filter((r) => r.status === EventAttendanceStatus.GOING).length,
  maybe: rows.filter((r) => r.status === EventAttendanceStatus.MAYBE).length,
  declined: rows.filter((r) => r.status === EventAttendanceStatus.DECLINED)
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
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);

  const rows = await eventRepo.findEventsBetween(userId, now, end, limit);

  return rows.map((ev) => ({
    id: ev.id,
    postId: ev.postId,
    groupId: ev.post.groupId,
    groupName: ev.post.group?.groupName ?? null,
    title: ev.title,
    description: ev.description,
    startAt: ev.startAt.toISOString(),
    endAt: ev.endAt ? ev.endAt.toISOString() : null,
    location: ev.location,
    attendeeSummary: summarizeAttendance(ev.attendees),
    myResponse:
      ev.attendees.find((a) => a.userId === userId)?.status ?? null,
  }));
};

const ensureCanAccessEvent = async (eventId: number, userId: number) => {
  const event = await eventRepo.findEvent(eventId);

  if (!event) {
    throw new AppError(404, "Sự kiện không tồn tại");
  }

  if (!event.post || event.post.status !== PostStatus.ACTIVE) {
    throw new AppError(400, "Sự kiện không khả dụng");
  }

  if (event.post.groupId) {
    const member = await eventRepo.findMemberInGroup(
      event.post.groupId,
      userId,
    );

    if (!member || member.status !== GroupMemberStatus.ACTIVE) {
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
  await ensureCanAccessEvent(eventId, userId);

  await eventRepo.saveAttendance(eventId, userId, status);

  const responses = await eventRepo.listAttendance(eventId);
  const myResponse =
    responses.find((r) => r.userId === userId)?.status ?? null;

  return {
    myResponse,
    attendeeSummary: summarizeAttendance(responses),
  };
};

export const getEventAttendeesService = async ({
  eventId,
  userId,
}: {
  eventId: number;
  userId: number;
}) => {
  await ensureCanAccessEvent(eventId, userId);

  const rows = await eventRepo.listAttendees(eventId);

  const attendees = await Promise.all(
    rows.map(async (row) => ({
      id: row.user.id,
      fullName: row.user.fullName,
      status: row.status,
      avatarUrl: row.user.profile?.avatarKey
        ? await getFileUrl(row.user.profile.avatarKey, 60 * 60)
        : null,
    })),
  );

  return {
    attendees,
    attendeeSummary: summarizeAttendance(rows),
  };
};
