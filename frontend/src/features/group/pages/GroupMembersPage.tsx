import { useEffect, useState } from "react";
import { type Member } from "@/features/group/types/group.type";
import { FilterSection } from "@/features/group/components/group-detail/member-list/FilterSection";
import { MemberTable } from "@/features/group/components/group-detail/member-list/MemberTable";
import { AddMemberModal } from "@/features/group/components/group-detail/member-list/AddMemberModal";
import { EditMemberRoleModal } from "@/features/group/components/group-detail/member-list/EditMemberRoleModal";
import { groupApi } from "../apis/group.api";
import { useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { GroupOutletContext } from "@/features/group/types/group-outlet.type";
import type {
  GroupMemberRole,
  MemberRoleFilter,
} from "@/features/group/utils/group-member";
import { useAuthStore } from "@/features/auth/store/auth.store";

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

export const GroupMembersPage = () => {
  const { groupId } = useParams();
  const { canManageMembers, currentMemberRole } =
    useOutletContext<GroupOutletContext>();
  const currentUser = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
    page: 1,
  });

  const fetchMembers = async () => {
    if (!groupId) return;

    try {
      const res = await groupApi.getMembers(
        groupId,
        currentPage,
        searchTerm,
        roleFilter ?? "",
      );

      setMembers(res.data.members);
      setPagination(res.data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId, currentPage, searchTerm, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const handleAddMember = async (email: string) => {
    if (!groupId) return;

    setAddingMember(true);
    try {
      await groupApi.addMember(groupId, { email });
      toast.success("Thêm thành viên thành công");
      setAddModalOpen(false);
      fetchMembers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateRole = async (memberRole: GroupMemberRole) => {
    if (!groupId || !editMember) return;

    setUpdatingRole(true);
    try {
      await groupApi.updateMemberRole(
        groupId,
        String(editMember.id),
        memberRole,
      );
      toast.success("Cập nhật quyền thành công");
      setEditMember(null);
      fetchMembers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    try {
      await groupApi.removeMember(groupId, memberId);
      toast.success("Đã xóa thành viên khỏi nhóm");
      fetchMembers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <FilterSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeRole={roleFilter}
        onRoleChange={setRoleFilter}
      />

      <MemberTable
        members={members}
        canManage={canManageMembers}
        actorRole={currentMemberRole}
        currentUserId={currentUser?.id}
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
        onAddMember={() => setAddModalOpen(true)}
        onEditMember={setEditMember}
        onRemoveMember={handleRemoveMember}
      />

      <AddMemberModal
        open={addModalOpen}
        loading={addingMember}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddMember}
      />

      {currentMemberRole && (
        <EditMemberRoleModal
          key={editMember?.id ?? "closed"}
          open={!!editMember}
          loading={updatingRole}
          member={editMember}
          actorRole={currentMemberRole}
          onClose={() => setEditMember(null)}
          onSubmit={handleUpdateRole}
        />
      )}
    </div>
  );
};
