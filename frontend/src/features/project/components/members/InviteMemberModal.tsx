import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Modal from "@/components/shared/Modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { projectApi } from "@/features/project/api/project.api";
import RoleChecklist from "@/features/project/components/members/RoleChecklist";
import {
  avatarColorClass,
  memberInitials,
} from "@/features/project/components/members/member-style";
import type {
  ProjectMemberCandidate,
  ProjectMemberRole,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { cn } from "@/lib/utils";

const FORM_ID = "invite-project-member";

type InviteMemberModalProps = {
  open: boolean;
  projectId: number;
  roles: ProjectMemberRole[];
  onClose: () => void;
  onInvited: () => void;
};

export default function InviteMemberModal({
  open,
  projectId,
  roles,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [candidates, setCandidates] = useState<ProjectMemberCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ProjectMemberCandidate | null>(null);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKeyword("");
    setDebouncedKeyword("");
    setCandidates([]);
    setSelected(null);
    setRoleIds([]);
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    if (!open || debouncedKeyword.length === 0) {
      setCandidates([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    const search = async () => {
      setSearching(true);
      try {
        const response = await projectApi.searchMemberCandidates(
          projectId,
          debouncedKeyword,
        );
        if (!cancelled) setCandidates(response.data);
      } catch (error) {
        if (!cancelled) {
          setCandidates([]);
          toastApiError(error);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    search();
    return () => {
      cancelled = true;
    };
  }, [open, projectId, debouncedKeyword]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || roleIds.length === 0) return;

    setSaving(true);
    try {
      await projectApi.addMember(projectId, {
        userId: selected.id,
        roleIds,
      });
      toast.success(t("pages.projects.membersPanel.invited"));
      onInvited();
      onClose();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.projects.membersPanel.inviteTitle")}
      description={t("pages.projects.membersPanel.inviteDescription")}
      size="lg"
      formId={FORM_ID}
      loading={saving}
      confirmText={t("pages.projects.membersPanel.invite")}
      confirmDisabled={!selected || roleIds.length === 0}
    >
      <div className="space-y-4">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3">
          <Search className="size-4 text-slate-400" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("pages.projects.membersPanel.searchUser")}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
          {debouncedKeyword.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              {t("pages.projects.membersPanel.typeToSearch")}
            </p>
          ) : searching ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              {t("common.processing")}
            </p>
          ) : candidates.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              {t("pages.projects.membersPanel.noCandidates")}
            </p>
          ) : (
            <ul>
              {candidates.map((candidate) => {
                const active = selected?.id === candidate.id;
                return (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(candidate)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-slate-50",
                        active && "bg-primary/5",
                      )}
                    >
                      <Avatar className="size-8">
                        {candidate.avatarUrl && (
                          <AvatarImage
                            src={candidate.avatarUrl}
                            alt={candidate.fullName}
                          />
                        )}
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold",
                            avatarColorClass(candidate.fullName),
                          )}
                        >
                          {memberInitials(candidate.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {candidate.fullName}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {candidate.email}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form id={FORM_ID} onSubmit={handleSubmit}>
          <RoleChecklist
            roles={roles}
            selectedIds={roleIds}
            onChange={setRoleIds}
          />
        </form>
      </div>
    </Modal>
  );
}
