import { ChevronLeft, ChevronRight } from "lucide-react";

type GroupPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const GroupPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: GroupPaginationProps) => {
  // tạo danh sách page hiển thị
  const generatePages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return pages;
  };

  const pages = generatePages();

  return (
    <div className="flex items-center justify-center gap-2 py-6 flex-wrap">
      {/* prev button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="
          w-10 h-10
          flex items-center justify-center
          rounded-xl
          border border-surface-container-high
          bg-surface
          hover:bg-surface-container
          transition-colors
          disabled:opacity-40
          disabled:cursor-not-allowed
        "
      >
        <ChevronLeft size={18} />
      </button>

      {/* page numbers */}
      {pages.map((page, index) =>
        typeof page === "string" ? (
          <span key={index} className="px-2 text-on-surface-variant text-sm">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              min-w-10 h-10 px-3
              rounded-xl
              text-sm font-semibold
              transition-all
              ${
                currentPage === page
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface border border-surface-container-high hover:bg-surface-container"
              }
            `}
          >
            {page}
          </button>
        ),
      )}

      {/* next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="
          w-10 h-10
          flex items-center justify-center
          rounded-xl
          border border-surface-container-high
          bg-surface
          hover:bg-surface-container
          transition-colors
          disabled:opacity-40
          disabled:cursor-not-allowed
        "
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default GroupPagination;
