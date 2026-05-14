import { useEffect, useState } from "react";

import GroupCard from "@/features/group/components/group-list/GroupCard";
import GroupFilter from "@/features/group/components/group-list/GroupFilter";
import GroupHeader from "@/features/group/components/group-list/GroupHeader";
import GroupPagination from "@/features/group/components/group-list/GroupPagination";
import CreateGroupModal from "@/features/group/components/group-list/CreateGroupModal";

import { groupApi } from "@/features/group/apis/group.api";

import type { Group } from "@/features/group/types/group.type";
import type { CreateGroupFormData } from "@/features/group/components/group-list/CreateGroupModal";
import { toast } from "sonner";

const GroupListPage = () => {
  const [onCreateGroupOpen, setOnCreateGroupOpen] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);

  const [filter, setFilter] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);

  // fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);

      const response = await groupApi.getGroups(
        searchQuery,
        filter,
        currentPage,
      );

      setGroups(response.data.groups);

      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // fetch when filter/page changes
  useEffect(() => {
    fetchGroups();
  }, [filter, currentPage]);

  // search
  const handleSearch = async () => {
    setCurrentPage(1);

    await fetchGroups();
  };

  // create group
  const handleCreateGroup = async (data: CreateGroupFormData) => {
    try {
      await groupApi.createGroup({
        groupName: data.groupName,
        description: data.description,
        groupType: data.groupType,
        departmentId: data.departmentId,
      });
      setOnCreateGroupOpen(false);
      await fetchGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await groupApi.joinGroup(groupId);
      fetchGroups();
      toast.success("Tham gia nhóm thành công");
    } catch (error) {
      console.error("Cannot join this group: ", error);
    }
  };

  return (
    <>
      <main className="flex-1 py-8 max-w-6xl mx-auto px-4">
        <div className="mb-10 space-y-6">
          <GroupHeader onClick={() => setOnCreateGroupOpen(true)} />

          <GroupFilter
            filter={filter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-on-surface-variant">Loading groups...</p>
          </div>
        ) : (
          <>
            {groups.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {groups.map((group) => (
                    <GroupCard
                      groupId={group.id}
                      key={group.id}
                      groupName={group.groupName}
                      groupType={group.groupType}
                      description={group.description}
                      isMember={group.isMember}
                      memberCount={group._count.members}
                      avatarUrl={group.avatarUrl}
                      coverUrl={group.coverUrl}
                      joinGroup={handleJoinGroup}
                    />
                  ))}
                </div>

                <GroupPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <h3 className="text-lg font-semibold mb-2">No groups found</h3>

                <p className="text-sm text-on-surface-variant">
                  Try changing your search or filters.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <CreateGroupModal
        open={onCreateGroupOpen}
        onClose={() => setOnCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </>
  );
};

export default GroupListPage;
