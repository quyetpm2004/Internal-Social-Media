import { useState } from "react";
import { Check, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { JoinRequest } from "@/features/group/types/group.type";
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

interface JoinRequestTableProps {
  requests: JoinRequest[];
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  processingUserId: string | null;
  onPageChange: (page: number) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export const JoinRequestTable = ({
  requests,
  currentPage,
  totalPages,
  total,
  limit,
  processingUserId,
  onPageChange,
  onApprove,
  onReject,
}: JoinRequestTableProps) => {
  const { t } = useTranslation();
  const [rejectTarget, setRejectTarget] = useState<JoinRequest | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("pages.groups.requester")}</TableHead>
            <TableHead>{t("common.email")}</TableHead>
            <TableHead>{t("pages.groups.submitDate")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-10 text-center whitespace-normal text-slate-500"
              >
                {t("pages.groups.noPendingRequests")}
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => {
              const isProcessing = processingUserId === String(request.id);

              return (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        alt={request.fullName}
                        className="h-10 w-10 rounded-lg object-cover"
                        src={
                          request.avatarUrl ||
                          getDefaultAvatarUrl(request.fullName)
                        }
                      />
                      <NavLink to={`/profile/${request.id}`}>
                        <span className="text-sm font-semibold text-slate-800 hover:text-primary">
                          {request.fullName}
                        </span>
                      </NavLink>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {request.email}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(request.requestedAt).toLocaleDateString("vi-VN", {
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
                        onClick={() => onApprove(String(request.id))}
                        className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                      >
                        <Check size={16} />
                        {t("pages.groups.approve")}
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setRejectTarget(request)}
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
          title={t("pages.groups.rejectRequestTitle")}
          description={t("pages.groups.rejectRequestDescription", { name: rejectTarget.fullName })}
          confirmText={t("pages.groups.reject")}
          variant="primary"
          onCancel={() => setRejectTarget(null)}
          onConfirm={() => {
            onReject(String(rejectTarget.id));
            setRejectTarget(null);
          }}
        />
      )}
    </>
  );
};
