import { useEffect, useState } from "react";
import { type Member } from "@/features/group/types/group.type";
import { FilterSection } from "@/features/group/components/group-detail/member-list/FilterSection";
import { MemberTable } from "@/features/group/components/group-detail/member-list/MemberTable";
import { groupApi } from "../apis/group.api";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export const GroupMembersPage = () => {
  const { groupId } = useParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");

  const [members, setMembers] = useState<Member[]>([]);

  const [currentPage, setCurrentPage] = useState(1);

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
        roleFilter,
      );

      setMembers(res.data.members);

      setPagination(res.data.pagination);
    } catch (error: any) {
      console.error("Failed to fetch members:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId, currentPage, searchTerm, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const handleAddMember = () => console.log("Add new member");

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    try {
      await groupApi.removeMember(groupId, memberId);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to remove member:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const handleEditMember = () => {};

  return (
    <main className="md:col-span-8 space-y-6">
      <FilterSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeRole={roleFilter}
        onRoleChange={setRoleFilter}
      />

      <MemberTable
        members={members}
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
        onAddMember={handleAddMember}
        onEditMember={handleEditMember}
        onRemoveMember={handleRemoveMember}
      />
    </main>
  );
};
