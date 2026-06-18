import { Request, Response } from "express";
import type { RespondEventInput } from "@/modules/event/event.schema";
import {
  getEventAttendeesService,
  getUpcomingEventsService,
  respondEventService,
} from "@/modules/event/event.service";

export async function getUpcomingEvents(req: Request, res: Response) {
  const result = await getUpcomingEventsService({
    userId: req.user!.id,
  });

  res.status(200).json({
    message: "Lấy danh sách sự kiện sắp tới thành công",
    data: { events: result },
  });
}

export async function respondEvent(req: Request, res: Response) {
  const eventId = Number(req.params.eventId);
  const { status } = req.validated as RespondEventInput;

  const result = await respondEventService({
    eventId,
    userId: req.user!.id,
    status,
  });

  res.status(200).json({
    message: "Cập nhật trạng thái tham gia sự kiện thành công",
    data: result,
  });
}

export async function getEventAttendees(req: Request, res: Response) {
  const eventId = Number(req.params.eventId);

  const result = await getEventAttendeesService({
    eventId,
    userId: req.user!.id,
  });

  res.status(200).json({
    message: "Lấy danh sách người tham gia sự kiện thành công",
    data: result,
  });
}
