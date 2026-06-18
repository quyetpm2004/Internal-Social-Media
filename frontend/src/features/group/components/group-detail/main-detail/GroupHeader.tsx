import React, { useRef, useState } from "react";
import {
  Globe,
  UserPlus,
  Share2,
  EarthLock,
  Activity,
  UserMinus,
  Clock,
  Camera,
  Eye,
} from "lucide-react";
import { NavLink, useParams } from "react-router-dom";
import ConfirmModal from "@/components/common/ConfirmModal";
import { toast } from "sonner";
import type { GroupMembershipStatus } from "@/features/group/types/group.type";
import {
  canManageGroupMembers,
  type GroupMemberRole,
} from "@/features/group/utils/group-member";
import { DEFAULT_COVER } from "@/constants/app";
import Lightbox from "yet-another-react-lightbox";
import { useTranslation } from "react-i18next";

type GroupHeaderProps = {
  name: string;
  type: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  memberCount: number;
  isMember: boolean;
  membershipStatus: GroupMembershipStatus;
  pendingRequestCount?: number;
  pendingPostCount?: number;
  postApprovalRequired?: boolean;
  coverUrl?: string;
  canEditMedia?: boolean;
  coverUploading?: boolean;
  onCoverChange?: (file: File) => void;
  onJoinLeave: () => void;
  currentMemberRole: GroupMemberRole | null;
};
const tabs = [
  { key: "discussion", path: "" },
  { key: "members", path: "members" },
  { key: "media", path: "media" },
  { key: "files", path: "files" },
  { key: "setting", path: "setting" },
  { key: "review", path: "review" },
];

const GroupHeader: React.FC<GroupHeaderProps> = ({
  name,
  type,
  memberCount,
  isMember,
  membershipStatus,
  pendingRequestCount = 0,
  pendingPostCount = 0,
  postApprovalRequired = false,
  coverUrl,
  canEditMedia = false,
  coverUploading = false,
  onCoverChange,
  onJoinLeave,
  currentMemberRole,
}) => {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const [showLeaveJoinConfirm, setShowLeaveJoinConfirm] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState(-1);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCoverChange) onCoverChange(file);
    e.target.value = "";
  };

  const isPending = membershipStatus === "PENDING";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("pages.groups.copyLinkSuccess"));
    } catch (error: unknown) {
      console.error("Copy failed:", error);
      toast.error(t("pages.posts.copyLinkFailed"));
    }
  };

  const getConfirmContent = () => {
    if (isMember) {
      return {
        title: t("pages.groups.leaveGroupTitle"),
        description: t("pages.groups.leaveGroupDescription"),
        confirmText: t("pages.chat.leaveGroup"),
      };
    }

    if (isPending) {
      return {
        title: t("pages.groups.cancelRequestTitle"),
        description: t("pages.groups.cancelRequestDescription"),
        confirmText: t("pages.groups.cancelRequest"),
      };
    }

    if (type === "PRIVATE") {
      return {
        title: t("pages.groups.requestJoinTitle"),
        description: t("pages.groups.requestJoinDescription"),
        confirmText: t("pages.groups.requestJoin"),
      };
    }

    return {
      title: t("pages.groups.joinTitle"),
      description: t("pages.groups.joinDescription"),
      confirmText: t("pages.groups.join"),
    };
  };

  const confirmContent = getConfirmContent();

  const renderActionButton = () => {
    if (isMember) {
      return (
        <>
          <UserMinus size={18} />
          <span>{t("pages.groups.leaveGroupAction")}</span>
        </>
      );
    }

    if (isPending) {
      return (
        <>
          <Clock size={18} />
          <span>{t("pages.groups.cancelRequest")}</span>
        </>
      );
    }

    if (type === "PRIVATE") {
      return (
        <>
          <UserPlus size={18} />
          <span>{t("pages.groups.requestJoin")}</span>
        </>
      );
    }

    return (
      <>
        <UserPlus size={18} />
        <span>{t("pages.groups.join")}</span>
      </>
    );
  };

  return (
    <section className="bg-white dark:bg-slate-900">
      <div className="relative h-64 md:h-80 w-full overflow-hidden group/cover">
        <img
          className="w-full h-full object-cover"
          src={coverUrl || DEFAULT_COVER}
          alt={t("pages.groups.coverImage")}
        />

        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />

        <div
          onClick={() => setIndex(1)}
          className="absolute bottom-4 left-4 rounded-lg opacity-0 group-hover/cover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white p-2"
        >
          <Eye size={18} />
        </div>

        {canEditMedia && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleCoverSelect}
            />

            <button
              type="button"
              disabled={coverUploading}
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm font-semibold rounded-lg shadow-lg opacity-0 group-hover/cover:opacity-100 focus:opacity-100 transition-opacity hover:bg-white disabled:opacity-60 cursor-pointer"
            >
              <Camera size={18} />
              {coverUploading ? t("common.loading") : t("pages.groups.changeCover")}
            </button>
          </>
        )}
      </div>

      <div className="w-full mx-auto px-6 py-4 relative">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
          <div className="flex items-end gap-6">
            <div className="mb-4 text-black dark:text-white">
              <h1 className="text-3xl font-extrabold mb-2">{name}</h1>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {type === "PUBLIC" && (
                    <>
                      <Globe size={16} />
                      <span>{t("pages.groups.privacyPublic")}</span>
                    </>
                  )}
                  {type === "PRIVATE" && (
                    <>
                      <EarthLock size={16} />
                      <span>{t("pages.groups.privacyPrivate")}</span>
                    </>
                  )}
                  {type === "DEPARTMENT" && (
                    <>
                      <Activity size={16} />
                      <span>{t("pages.groups.privacyDepartment")}</span>
                    </>
                  )}
                </span>
                <span className="text-black/60">•</span>
                <span className="text-sm font-semibold">
                  {memberCount.toLocaleString()} {t("pages.groups.members")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              type="button"
              className={`px-6 py-2.5 font-bold cursor-pointer rounded-xl flex items-center gap-2 transition-colors shadow-lg ${
                isPending
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-amber-200/30"
                  : "bg-blue-700 text-white hover:bg-blue-800 shadow-blue-700/20"
              }`}
              onClick={() => setShowLeaveJoinConfirm(true)}
            >
              {renderActionButton()}
            </button>

            <button
              type="button"
              className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              onClick={handleCopyLink}
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-8 border-t border-slate-100 dark:border-slate-800 pt-1 overflow-x-auto scrollbar-hide">
          {tabs.map((item) => {
            const to = item.path
              ? `/groups/${groupId}/${item.path}`
              : `/groups/${groupId}`;

            const showJoinBadge =
              item.path === "members" && pendingRequestCount > 0;
            const showPostReviewBadge =
              item.path === "review" && pendingPostCount > 0;

            if (
              item.key === "setting" &&
              currentMemberRole !== "ADMIN"
            ) {
              return null;
            }

            if (
              item.path === "review" &&
              (!postApprovalRequired ||
                !canManageGroupMembers(currentMemberRole))
            ) {
              return null;
            }

            return (
              <NavLink
                key={item.key}
                to={to}
                end={!item.path}
                className={({ isActive }) =>
                  `py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? "text-blue-700 border-blue-700"
                      : "text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                {t(`pages.groups.tabs.${item.key}`)}

                {showJoinBadge && (
                  <span className="min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                  </span>
                )}
                {showPostReviewBadge && (
                  <span className="min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {pendingPostCount > 99 ? "99+" : pendingPostCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {showLeaveJoinConfirm && (
        <ConfirmModal
          open={showLeaveJoinConfirm}
          title={confirmContent.title}
          description={confirmContent.description}
          confirmText={confirmContent.confirmText}
          variant="primary"
          onCancel={() => setShowLeaveJoinConfirm(false)}
          onConfirm={() => {
            setShowLeaveJoinConfirm(false);
            onJoinLeave();
          }}
        />
      )}

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={[{ src: coverUrl || DEFAULT_COVER }]}
        controller={{
          closeOnBackdropClick: true,
        }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
      />
    </section>
  );
};

export default GroupHeader;
