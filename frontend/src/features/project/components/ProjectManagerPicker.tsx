import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Input from "@/components/shared/Input";
import { projectApi } from "@/features/project/api/project.api";
import type { ProjectMemberCandidate } from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

const SEARCH_DEBOUNCE_MS = 350;

export type PickedManager = Pick<ProjectMemberCandidate, "id" | "fullName" | "email">;

type ProjectManagerPickerProps = {
  value: PickedManager | null;
  onChange: (value: PickedManager | null) => void;
  /** Cho phép chọn nhanh chính mình (tạo dự án). */
  self?: PickedManager | null;
};

/** Chọn người làm quản trị dự án (PM): tìm theo tên hoặc email. */
export default function ProjectManagerPicker({
  value,
  onChange,
  self,
}: ProjectManagerPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProjectMemberCandidate[]>([]);

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      projectApi
        .searchManagerCandidates(keyword)
        .then((response) => {
          if (!cancelled) setResults(response.data);
        })
        .catch((error: unknown) => {
          if (!cancelled) toastApiError(error);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="space-y-2">
      {value && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-900">
              {value.fullName}
            </span>
            <span className="block truncate text-xs text-slate-500">{value.email}</span>
          </span>
          <button
            type="button"
            aria-label={t("common.delete")}
            onClick={() => onChange(null)}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {!value && (
        <>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("pages.projects.managerSearchPlaceholder")}
            />
            {self && (
              <button
                type="button"
                onClick={() => onChange(self)}
                className="shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t("pages.projects.managerSelf")}
              </button>
            )}
          </div>
          {query.trim() && results.length > 0 && (
            <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {results.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(person);
                      setQuery("");
                      setResults([]);
                    }}
                    className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {person.fullName}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {person.email}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
