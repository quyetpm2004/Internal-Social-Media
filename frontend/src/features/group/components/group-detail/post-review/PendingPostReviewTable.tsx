import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { PendingGroupPost } from "@/features/group/types/group.type";
import ConfirmModal from "@/components/common/ConfirmModal";
import { getDefaultAvatarUrl } from "@/lib/utils";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() || html;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

interface PendingPostReviewTableProps {
  groupId: string;
  posts: PendingGroupPost[];
  currentPage: number;
  totalPages: number;
  processingPostId: number | null;
  onPageChange: (page: number) => void;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
}

export const PendingPostReviewTable = ({
  groupId,
  posts,
  currentPage,
  totalPages,
  processingPostId,
  onPageChange,
  onApprove,
  onReject,
}: PendingPostReviewTableProps) => {
  const [rejectTarget, setRejectTarget] = useState<PendingGroupPost | null>(
    null,
  );

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/30">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Người đăng
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Nội dung
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Ngày gửi
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {posts.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-on-surface-variant"
                >
                  Không có bài viết nào đang chờ duyệt.
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const isProcessing = processingPostId === post.id;
                const preview = truncateText(stripHtml(post.content), 120);

                return (
                  <tr
                    key={post.id}
                    className="hover:bg-surface-container/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          alt={post.author.fullName}
                          className="w-10 h-10 rounded-lg object-cover"
                          src={
                            post.author.avatarUrl ||
                            getDefaultAvatarUrl(post.author.fullName)
                          }
                        />
                        <div>
                          <NavLink to={`/profile/${post.author.id}`}>
                            <span className="font-semibold text-sm text-on-surface hover:text-primary">
                              {post.author.fullName}
                            </span>
                          </NavLink>
                          <p className="text-xs text-on-surface-variant">
                            {post.author.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant max-w-md">
                      <p className="line-clamp-2">{preview}</p>
                      {post.attachmentCount > 0 && (
                        <p className="text-xs mt-1 text-on-surface-variant/80">
                          {post.attachmentCount} tệp đính kèm
                        </p>
                      )}
                      <NavLink
                        to={`/groups/${groupId}/posts/${post.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                      >
                        Xem chi tiết
                        <ExternalLink size={12} />
                      </NavLink>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onApprove(post.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <Check size={16} />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setRejectTarget(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <X size={16} />
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-outline-variant/20 bg-surface-container-low/50">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-2 rounded-lg border disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-2 rounded-lg border disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {rejectTarget && (
        <ConfirmModal
          open={!!rejectTarget}
          title="Từ chối bài viết?"
          description={`Bài viết của ${rejectTarget.author.fullName} sẽ không được đăng lên nhóm.`}
          confirmText="Từ chối"
          variant="primary"
          onCancel={() => setRejectTarget(null)}
          onConfirm={() => {
            onReject(rejectTarget.id);
            setRejectTarget(null);
          }}
        />
      )}
    </>
  );
};
