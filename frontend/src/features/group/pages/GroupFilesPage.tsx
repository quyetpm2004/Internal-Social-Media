import { useEffect, useState } from "react";
import { Download, FileText, User } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { groupApi } from "@/features/group/apis/group.api";
import { AttachmentSearchBar } from "@/features/group/components/group-detail/attachments/AttachmentSearchBar";
import Pagination from "@/components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import type { GroupAttachmentItem } from "@/features/group/types/group.type";
import { formatFileSize } from "@/features/group/utils/formatFileSize";
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Unexpected error"
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const GroupFilesPage = () => {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const [items, setItems] = useState<GroupAttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
    page: 1,
  });

  const fetchFiles = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      const res = await groupApi.getGroupFiles(groupId, currentPage, searchTerm);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [groupId, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("pages.groups.filesTitle")}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t("pages.groups.filesDescription")}
        </p>
      </div>

      <AttachmentSearchBar
        placeholder={t("pages.groups.searchFilesPlaceholder")}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {loading ? (
        <div className="py-16 text-center text-slate-500">{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">{t("pages.groups.noFiles")}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.groups.fileName")}</TableHead>
              <TableHead className="hidden sm:table-cell">
                {t("pages.groups.fileSize")}
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {t("pages.groups.uploader")}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t("pages.groups.uploadDate")}
              </TableHead>
              <TableHead className="text-right">
                {t("pages.groups.download")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-normal">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText size={18} className="shrink-0 text-blue-700" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.fileName}</p>
                      {item.post && (
                        <Link
                          to={`/groups/${groupId}/posts/${item.post.id}`}
                          className="block truncate text-xs text-blue-700 hover:underline"
                        >
                          {t("pages.groups.viewPost")}
                        </Link>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-slate-500 sm:table-cell">
                  {formatFileSize(item.fileSize)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.post ? (
                    <div className="flex items-center gap-2">
                      {item.post.author.avatarUrl ? (
                        <img
                          src={item.post.author.avatarUrl}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-slate-400" />
                      )}
                      <span className="max-w-[140px] truncate">
                        {item.post.author.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-slate-500 lg:table-cell">
                  {formatDate(item.uploadedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <a
                    href={item.fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title={t("pages.groups.download")}
                  >
                    <Download size={18} />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!loading && (
        <p className="text-xs text-slate-400 mt-4">
          {t("pages.groups.totalFiles", { count: pagination.total })}
        </p>
      )}

      {pagination.totalPages > 1 && (
        <Pagination
          pagination={{
            page: currentPage,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
          }}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default GroupFilesPage;
