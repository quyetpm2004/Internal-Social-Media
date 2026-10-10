import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Modal from "@/components/shared/Modal";
import { projectApi } from "@/features/project/api/project.api";
import EditMemberRolesModal from "@/features/project/components/members/EditMemberRolesModal";
import InviteMemberModal from "@/features/project/components/members/InviteMemberModal";
import MemberCard from "@/features/project/components/members/MemberCard";
import { sortRoles } from "@/features/project/components/members/member-style";
import type {
  ProjectMemberItem,
  ProjectMembersData,
} from "@/features/project/types/project.type";
import {
  getApiErrorMessages,
  toastApiError,
} from "@/features/project-template/utils/api-error";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/lib/utils";

type ProjectMembersPanelProps = {
  projectId: number;
  onTotalChange: (total: number) => void;
};

export default function ProjectMembersPanel({
  projectId,
  onTotalChange,
}: ProjectMembersPanelProps) {
  const { t, i18n } = useTranslation();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [data, setData] = useState<ProjectMembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectMemberItem | null>(null);
  const [removing, setRemoving] = useState<ProjectMemberItem | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedKeyword(keyword.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const response = await projectApi.getMembers(projectId, {
          keyword: debouncedKeyword || undefined,
          roleId: roleId ?? undefined,
        });
        if (cancelled) return;
        setData(response.data);
        setError("");
        onTotalChange(response.data.total);
      } catch (loadError) {
        if (cancelled) return;
        const message = getApiErrorMessages(loadError)[0];
        setError(
          message && message !== "Unexpected error"
            ? message
            : t("pages.projects.membersPanel.loadFailed"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [projectId, debouncedKeyword, roleId, reloadKey, onTotalChange, t]);

  const refresh = () => setReloadKey((value) => value + 1);

  const handleRemove = async () => {
    if (!removing) return;
    setRemovingBusy(true);
    try {
      await projectApi.removeMember(projectId, removing.userId);
      toast.success(t("pages.projects.membersPanel.removed"));
      setRemoving(null);
      refresh();
    } catch (removeError) {
      toastApiError(removeError);
    } finally {
      setRemovingBusy(false);
    }
  };

  const roles = sortRoles(data?.roles ?? []);
  const myRoleNames = (data?.myRoles ?? []).map((role) => role.name).join(", ");
  const hint =
    data?.canManage && myRoleNames
      ? t("pages.projects.membersPanel.manageHint", { roles: myRoleNames })
      : myRoleNames
        ? t("pages.projects.membersPanel.viewHint", { roles: myRoleNames })
        : t("pages.projects.membersPanel.guestHint");

  const members = (data?.members ?? []).map((member) => ({
    ...member,
    isMe: member.isMe || member.userId === currentUserId,
  }));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("pages.projects.membersPanel.title")}
            </h2>
            {data && (
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {t("pages.projects.membersPanel.people", { count: data.total })}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{data ? hint : " "}</p>
        </div>
        {data?.canManage && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <UserPlus className="size-4" />
            {t("pages.projects.membersPanel.invite")}
          </button>
        )}
      </div>

      <div className="mt-5 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
        <Search className="size-4 text-slate-400" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t("pages.projects.membersPanel.searchPlaceholder")}
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip
          active={roleId === null}
          label={t("pages.projects.membersPanel.all")}
          onClick={() => setRoleId(null)}
        />
        {roles.map((role) => (
          <FilterChip
            key={role.id}
            active={roleId === role.id}
            label={role.name}
            onClick={() => setRoleId(role.id)}
          />
        ))}
      </div>

      <div className="mt-4">
        {loading && !data ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : error && !data ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-3 cursor-pointer text-sm font-semibold text-primary"
            >
              {t("pages.projects.membersPanel.retry")}
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
            {data && data.total === 0
              ? t("pages.projects.membersPanel.empty")
              : t("pages.projects.membersPanel.noMatch")}
          </div>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4",
              loading && "opacity-70",
            )}
          >
            {members.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                roleCatalog={roles}
                canManage={Boolean(data?.canManage)}
                language={i18n.language}
                onEdit={setEditing}
                onRemove={setRemoving}
              />
            ))}
          </div>
        )}
        {error && data && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <InviteMemberModal
        open={inviteOpen}
        projectId={projectId}
        roles={roles}
        onClose={() => setInviteOpen(false)}
        onInvited={refresh}
      />
      <EditMemberRolesModal
        projectId={projectId}
        member={editing}
        roles={roles}
        onClose={() => setEditing(null)}
        onUpdated={refresh}
      />
      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={t("pages.projects.membersPanel.removeTitle")}
        description={
          removing
            ? t("pages.projects.membersPanel.removeDescription", {
                name: removing.fullName,
              })
            : undefined
        }
        variant="danger"
        loading={removingBusy}
        confirmText={t("pages.projects.membersPanel.remove")}
        onConfirm={handleRemove}
      />
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 cursor-pointer rounded-full border px-3 text-sm font-medium",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}
