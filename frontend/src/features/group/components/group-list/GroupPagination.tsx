import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type GroupPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildPages(page: number, totalPages: number) {
  if (totalPages <= 5) {
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

const GroupPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: GroupPaginationProps) => {
  const { t } = useTranslation();
  const pages = buildPages(currentPage, totalPages);

  const buttonClass =
    "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label={t("common.pagination.page", { page: currentPage })}
      className="flex items-center justify-center gap-1.5 pt-2"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label={t("common.pagination.previous")}
        className={`${buttonClass} border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800`}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, index) =>
        page === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-slate-400">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            aria-label={t("common.pagination.page", { page })}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
            className={
              page === currentPage
                ? `${buttonClass} bg-blue-600 text-white hover:bg-blue-700`
                : `${buttonClass} border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800`
            }
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label={t("common.pagination.next")}
        className={`${buttonClass} border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800`}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default GroupPagination;
