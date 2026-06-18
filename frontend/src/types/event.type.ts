export interface EventInput {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
}

export interface EventSummary {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  attendeeSummary: {
    going: number;
    maybe: number;
    declined: number;
  };
  myResponse: EventAttendanceStatus | null;
}

export type EventAttendanceStatus = "GOING" | "MAYBE" | "DECLINED";

export interface EventAttendee {
  id: number;
  fullName: string;
  status: EventAttendanceStatus;
  avatarUrl: string | null;
}
