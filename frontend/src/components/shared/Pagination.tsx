import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export type PaginationData = {
  page: number;
  limit?: number;
  total: number;
  totalPages: number;
};

type PaginationProps = {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
};

function buildPages(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "gap"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("gap");
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < totalPages - 1) items.push("gap");
  items.push(totalPages);

  return items;
}

export default function Pagination({
  pagination,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const { page, totalPages, total } = pagination;

  if (totalPages < 1) return null;

  const pageSize =
    pagination.limit && pagination.limit > 0
      ? pagination.limit
      : Math.max(1, Math.ceil(total / totalPages));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = buildPages(page, totalPages);

  const controlClass =
    "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {t("common.pagination.showing", { from, to, total })}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("common.pagination.previous")}
          className={`${controlClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((item, index) =>
          item === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={t("common.pagination.page", { page: item })}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={
                item === page
                  ? `${controlClass} border-primary bg-primary text-white hover:bg-primary/90`
                  : `${controlClass} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
              }
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("common.pagination.next")}
          className={`${controlClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
