import type { Pagination } from "@/features/admin/types/admin.type";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminPaginationProps = {
  pagination: Pagination;
  onPageChange: (page: number) => void;
};

export default function AdminPagination({
  pagination,
  onPageChange,
}: AdminPaginationProps) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-muted-foreground">
        Trang {page}/{totalPages} ({total} mục)
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-100"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-100"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
