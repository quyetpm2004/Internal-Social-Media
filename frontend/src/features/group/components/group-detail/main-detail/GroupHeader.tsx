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
  Users,
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
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="group/cover relative h-52 w-full overflow-hidden md:h-64">
        <img
          className="h-full w-full object-cover"
          src={coverUrl || DEFAULT_COVER}
          alt={t("pages.groups.coverImage")}
        />

        <div className="absolute inset-0 bg-linear-to-t from-slate-900/55 to-transparent" />

        <button
          type="button"
          onClick={() => setIndex(0)}
          className="absolute bottom-4 left-4 cursor-pointer rounded-lg bg-white/90 p-2 text-slate-900 opacity-100 transition-opacity focus:opacity-100 md:opacity-0 md:group-hover/cover:opacity-100 dark:bg-slate-900/90 dark:text-white"
          aria-label={t("pages.groups.coverImage")}
        >
          <Eye size={18} />
        </button>

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
              className="absolute right-4 bottom-4 flex cursor-pointer items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 opacity-100 shadow-lg transition-opacity hover:bg-white focus:opacity-100 disabled:opacity-60 md:opacity-0 md:group-hover/cover:opacity-100 dark:bg-slate-900/90 dark:text-white"
            >
              <Camera size={18} />
              {coverUploading ? t("common.loading") : t("pages.groups.changeCover")}
            </button>
          </>
        )}
      </div>

      <div className="relative px-5 py-4 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {type === "PUBLIC" && (
                  <>
                    <Globe size={14} />
                    <span>{t("pages.groups.privacyPublic")}</span>
                  </>
                )}
                {type === "PRIVATE" && (
                  <>
                    <EarthLock size={14} />
                    <span>{t("pages.groups.privacyPrivate")}</span>
                  </>
                )}
                {type === "DEPARTMENT" && (
                  <>
                    <Activity size={14} />
                    <span>{t("pages.groups.privacyDepartment")}</span>
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <Users size={14} />
                {t("pages.groups.memberCount", {
                  count: memberCount.toLocaleString(),
                })}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isPending
                  ? "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
                  : isMember
                    ? "border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              onClick={() => setShowLeaveJoinConfirm(true)}
            >
              {renderActionButton()}
            </button>

            <button
              type="button"
              className="rounded-xl bg-slate-100 p-2.5 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={handleCopyLink}
              aria-label={t("pages.groups.copyLinkSuccess")}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <div className="scrollbar-hide mt-4 flex gap-6 overflow-x-auto border-t border-slate-100 pt-1 dark:border-slate-800">
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
                  `flex items-center gap-2 border-b-2 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
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
