import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Loader2, MapPin, Users, X } from "lucide-react";
import type {
  EventAttendanceStatus,
  EventAttendee,
  EventSummary,
} from "@/types/event.type";
import { eventApi } from "@/features/event/api/event.api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

interface EventCardProps {
  event: EventSummary;
  onUpdated?: (event: EventSummary) => void;
}

const EventCard = ({ event, onUpdated }: EventCardProps) => {
  const { t } = useTranslation();
  const [localEvent, setLocalEvent] = useState(event);
  const [savingStatus, setSavingStatus] = useState(false);
  const [openAttendees, setOpenAttendees] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);

  const attendeesByStatus = useMemo(
    () => ({
      GOING: attendees.filter((item) => item.status === "GOING"),
      MAYBE: attendees.filter((item) => item.status === "MAYBE"),
      DECLINED: attendees.filter((item) => item.status === "DECLINED"),
    }),
    [attendees],
  );

  const handleRespond = async (status: EventAttendanceStatus) => {
    try {
      setSavingStatus(true);
      const res = await eventApi.respond(localEvent.id, status);
      const updated = {
        ...localEvent,
        myResponse: res.data.myResponse,
        attendeeSummary: res.data.attendeeSummary,
      };
      setLocalEvent(updated);
      onUpdated?.(updated);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || t("pages.event.updateStatusFailed");
      toast.error(message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleOpenAttendees = async () => {
    try {
      setOpenAttendees(true);
      setLoadingAttendees(true);
      const res = await eventApi.getAttendees(localEvent.id);
      setAttendees(res.data.attendees);
      const updated = {
        ...localEvent,
        attendeeSummary: res.data.attendeeSummary,
      };
      setLocalEvent(updated);
      onUpdated?.(updated);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || t("pages.event.loadAttendeesFailed");
      toast.error(message);
    } finally {
      setLoadingAttendees(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4">
      <div className="flex items-start gap-2 mb-2">
        <CalendarDays
          size={18}
          className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5"
        />
        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
          {localEvent.title}
        </h4>
      </div>

      {localEvent.description ? (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 whitespace-pre-wrap">
          {localEvent.description}
        </p>
      ) : null}

      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Clock3 size={14} className="shrink-0" />
          <span>
            {formatDateTime(localEvent.startAt)}
            {localEvent.endAt ? ` - ${formatDateTime(localEvent.endAt)}` : ""}
          </span>
        </div>
        {localEvent.location ? (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0" />
            <span>{localEvent.location}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
        <span className="font-medium">
          {localEvent.attendeeSummary.going} {t("pages.event.going")}
        </span>
        <span className="mx-1">·</span>
        <span>{localEvent.attendeeSummary.maybe} {t("pages.event.interested")}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleRespond("GOING")}
          disabled={savingStatus}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            localEvent.myResponse === "GOING"
              ? "bg-emerald-600 text-white"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          }`}
        >
          {savingStatus && localEvent.myResponse !== "GOING" ? (
            <Loader2 size={12} className="animate-spin inline mr-1" />
          ) : null}
          {t("pages.event.going")}
        </button>
        <button
          type="button"
          onClick={() => handleRespond("MAYBE")}
          disabled={savingStatus}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            localEvent.myResponse === "MAYBE"
              ? "bg-amber-500 text-white"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          }`}
        >
          {t("pages.event.interested")}
        </button>
        <button
          type="button"
          onClick={() => handleRespond("DECLINED")}
          disabled={savingStatus}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            localEvent.myResponse === "DECLINED"
              ? "bg-slate-500 text-white"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          {t("pages.event.notGoing")}
        </button>
      </div>

      <button
        type="button"
        onClick={handleOpenAttendees}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
      >
        <Users size={14} />
        {t("pages.event.viewAttendees")}
      </button>

      {openAttendees ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold">{t("pages.event.attendeesTitle")}</h3>
              <button
                type="button"
                onClick={() => setOpenAttendees(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingAttendees ? (
                <div className="text-sm text-slate-500">{t("common.loading")}</div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold mb-2">
                      {t("pages.event.going")} ({attendeesByStatus.GOING.length})
                    </p>
                    <div className="space-y-2">
                      {attendeesByStatus.GOING.map((item) => (
                        <div key={`going-${item.id}`} className="text-sm">
                          {item.fullName}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">
                      {t("pages.event.interested")} ({attendeesByStatus.MAYBE.length})
                    </p>
                    <div className="space-y-2">
                      {attendeesByStatus.MAYBE.map((item) => (
                        <div key={`maybe-${item.id}`} className="text-sm">
                          {item.fullName}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">
                      {t("pages.event.notGoing")} ({attendeesByStatus.DECLINED.length})
                    </p>
                    <div className="space-y-2">
                      {attendeesByStatus.DECLINED.map((item) => (
                        <div key={`declined-${item.id}`} className="text-sm">
                          {item.fullName}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EventCard;
