import { useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { PendingGroupPost } from "@/features/group/types/group.type";
import ConfirmModal from "@/components/common/ConfirmModal";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import Pagination from "@/components/shared/Pagination";

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
  total: number;
  limit: number;
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
  total,
  limit,
  processingPostId,
  onPageChange,
  onApprove,
  onReject,
}: PendingPostReviewTableProps) => {
  const { t } = useTranslation();
  const [rejectTarget, setRejectTarget] = useState<PendingGroupPost | null>(
    null,
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.author")}</TableHead>
            <TableHead>{t("common.content")}</TableHead>
            <TableHead>{t("pages.groups.submitDate")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-10 text-center whitespace-normal text-slate-500"
              >
                {t("pages.groups.noPendingPosts")}
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => {
              const isProcessing = processingPostId === post.id;
              const preview = truncateText(stripHtml(post.content), 120);

              return (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        alt={post.author.fullName}
                        className="h-10 w-10 rounded-lg object-cover"
                        src={
                          post.author.avatarUrl ||
                          getDefaultAvatarUrl(post.author.fullName)
                        }
                      />
                      <div>
                        <NavLink to={`/profile/${post.author.id}`}>
                          <span className="text-sm font-semibold text-slate-800 hover:text-primary">
                            {post.author.fullName}
                          </span>
                        </NavLink>
                        <p className="text-xs text-slate-500">
                          {post.author.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal text-slate-500">
                    <p className="line-clamp-2">{preview}</p>
                    {post.attachmentCount > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {post.attachmentCount} {t("common.attachments")}
                      </p>
                    )}
                    <NavLink
                      to={`/groups/${groupId}/posts/${post.id}`}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {t("common.details")}
                      <ExternalLink size={12} />
                    </NavLink>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => onApprove(post.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                      >
                        <Check size={16} />
                        {t("pages.groups.approve")}
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setRejectTarget(post)}
                        className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={16} />
                        {t("pages.groups.reject")}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination
          pagination={{ page: currentPage, limit, total, totalPages }}
          onPageChange={onPageChange}
        />
      )}

      {rejectTarget && (
        <ConfirmModal
          open={!!rejectTarget}
          title={t("pages.groups.rejectPostTitle")}
          description={t("pages.groups.rejectPostDescription", { name: rejectTarget.author.fullName })}
          confirmText={t("pages.groups.reject")}
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
