import { useEffect, useState } from "react";
import { Download, FileText, User } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { groupApi } from "@/features/group/apis/group.api";
import { AttachmentSearchBar } from "@/features/group/components/group-detail/attachments/AttachmentSearchBar";
import GroupPagination from "@/features/group/components/group-list/GroupPagination";
import type { GroupAttachmentItem } from "@/features/group/types/group.type";
import { formatFileSize } from "@/features/group/utils/formatFileSize";

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">File</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tài liệu đính kèm từ các bài viết trong nhóm
        </p>
      </div>

      <AttachmentSearchBar
        placeholder="Tìm theo tên file..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {loading ? (
        <div className="py-16 text-center text-slate-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có file nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">Tên file</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">
                  Kích thước
                </th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">
                  Người đăng
                </th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">
                  Ngày tải
                </th>
                <th className="px-4 py-3 font-semibold text-right">Tải xuống</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText
                        size={18}
                        className="text-blue-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.fileName}</p>
                        {item.post && (
                          <Link
                            to={`/groups/${groupId}/posts/${item.post.id}`}
                            className="text-xs text-blue-700 hover:underline truncate block"
                          >
                            Xem bài viết
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-500">
                    {formatFileSize(item.fileSize)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {item.post ? (
                      <div className="flex items-center gap-2">
                        {item.post.author.avatarUrl ? (
                          <img
                            src={item.post.author.avatarUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-slate-400" />
                        )}
                        <span className="truncate max-w-[140px]">
                          {item.post.author.fullName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500">
                    {formatDate(item.uploadedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={item.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Tải xuống"
                    >
                      <Download size={18} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <p className="text-xs text-slate-400 mt-4">
          Tổng cộng {pagination.total} file
        </p>
      )}

      {pagination.totalPages > 1 && (
        <GroupPagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default GroupFilesPage;
