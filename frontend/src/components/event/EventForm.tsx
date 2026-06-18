import { X } from "lucide-react";
import type { EventInput } from "@/types/event.type";
import { useTranslation } from "react-i18next";

interface EventFormProps {
  value: EventInput;
  onChange: (value: EventInput) => void;
  onRemove?: () => void;
}

const EventForm = ({ value, onChange, onRemove }: EventFormProps) => {
  const { t } = useTranslation();
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {t("pages.posts.event")}
        </p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label={t("common.delete")}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <input
        type="text"
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
        placeholder={t("pages.event.titlePlaceholder")}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />

      <textarea
        rows={3}
        value={value.description ?? ""}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
        placeholder={t("pages.event.descriptionPlaceholder")}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t("pages.event.start")}
          </label>
          <input
            type="datetime-local"
            value={value.startAt}
            onChange={(e) => onChange({ ...value, startAt: e.target.value })}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t("pages.event.end")}
          </label>
          <input
            type="datetime-local"
            value={value.endAt ?? ""}
            onChange={(e) =>
              onChange({ ...value, endAt: e.target.value || undefined })
            }
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      <input
        type="text"
        value={value.location ?? ""}
        onChange={(e) => onChange({ ...value, location: e.target.value })}
        placeholder={t("pages.event.locationPlaceholder")}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />
    </div>
  );
};

export default EventForm;
