import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  EventAttendanceStatus,
  EventAttendee,
  EventSummary,
} from "@/types/event.type";

export interface UpcomingEventSummary extends EventSummary {
  postId: number;
  groupId: number | null;
  groupName: string | null;
}

export const eventApi = {
  listUpcoming() {
    return axiosClient.get<
      ApiResponse<{ events: UpcomingEventSummary[] }>
    >("/events/upcoming");
  },

  respond(eventId: number, status: EventAttendanceStatus) {
    return axiosClient.post<
      ApiResponse<{
        myResponse: EventAttendanceStatus | null;
        attendeeSummary: {
          going: number;
          maybe: number;
          declined: number;
        };
      }>
    >(`/events/${eventId}/respond`, { status });
  },

  getAttendees(eventId: number) {
    return axiosClient.get<
      ApiResponse<{
        attendees: EventAttendee[];
        attendeeSummary: {
          going: number;
          maybe: number;
          declined: number;
        };
      }>
    >(`/events/${eventId}/attendees`);
  },
};
