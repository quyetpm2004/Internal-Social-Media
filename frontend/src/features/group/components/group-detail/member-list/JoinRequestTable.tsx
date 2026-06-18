import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { JoinRequest } from "@/features/group/types/group.type";
import ConfirmModal from "@/components/common/ConfirmModal";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface JoinRequestTableProps {
  requests: JoinRequest[];
  currentPage: number;
  totalPages: number;
  processingUserId: string | null;
  onPageChange: (page: number) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export const JoinRequestTable = ({
  requests,
  currentPage,
  totalPages,
  processingUserId,
  onPageChange,
  onApprove,
  onReject,
}: JoinRequestTableProps) => {
  const { t } = useTranslation();
  const [rejectTarget, setRejectTarget] = useState<JoinRequest | null>(null);

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/30">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t("pages.groups.requester")}
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t("common.email")}
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t("pages.groups.submitDate")}
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-on-surface-variant"
                >
                  {t("pages.groups.noPendingRequests")}
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const isProcessing = processingUserId === String(request.id);

                return (
                  <tr
                    key={request.id}
                    className="hover:bg-surface-container/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          alt={request.fullName}
                          className="w-10 h-10 rounded-lg object-cover"
                          src={
                            request.avatarUrl ||
                            getDefaultAvatarUrl(request.fullName)
                          }
                        />
                        <NavLink to={`/profile/${request.id}`}>
                          <span className="font-semibold text-sm text-on-surface hover:text-primary">
                            {request.fullName}
                          </span>
                        </NavLink>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {request.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(request.requestedAt).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onApprove(String(request.id))}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <Check size={16} />
                          {t("pages.groups.approve")}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setRejectTarget(request)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <X size={16} />
                          {t("pages.groups.reject")}
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
            {t("pages.groups.page")} {currentPage} / {totalPages}
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
