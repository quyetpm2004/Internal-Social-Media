import { Router } from "express";
import {
  getEventAttendees,
  getUpcomingEvents,
  respondEvent,
} from "@/modules/event/event.controller";
import {
  eventIdParamsSchema,
  respondEventSchema,
} from "@/modules/event/event.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/upcoming", asyncHandler(getUpcomingEvents));

router.post(
  "/:eventId/respond",
  validateParams(eventIdParamsSchema),
  validateBody(respondEventSchema),
  asyncHandler(respondEvent),
);

router.get(
  "/:eventId/attendees",
  validateParams(eventIdParamsSchema),
  asyncHandler(getEventAttendees),
);

export default router;
