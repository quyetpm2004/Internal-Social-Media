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
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";

const GroupListSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="h-36 animate-pulse bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="mt-4 h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    ))}
  </div>
);

const GroupListPage = () => {
  const { t } = useTranslation();
  const [onCreateGroupOpen, setOnCreateGroupOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setTotalCount(response.data.pagination.total);
    } catch (error: any) {
      console.error("Failed to fetch groups:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // fetch when filter/page changes
  useEffect(() => {
    fetchGroups();
  }, [filter, currentPage]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
  };

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
    } catch (error: any) {
      console.error("Failed to create group:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await groupApi.joinGroup(groupId);
      await fetchGroups();
      toast.success(response.message);
    } catch (error: any) {
      console.error("Cannot join this group: ", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("common.genericError");
      toast.error(message);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-6xl flex-1 px-3 py-6 sm:px-5 md:py-8">
        <div className="md:hidden">
          <button
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-2 pb-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">{t("common.back")}</span>
          </button>
        </div>
        <div className="mb-6 space-y-4">
          <GroupHeader onClick={() => setOnCreateGroupOpen(true)} />

          <GroupFilter
            filter={filter}
            setFilter={handleFilterChange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            resultCount={loading ? undefined : totalCount}
          />
        </div>

        {loading ? (
          <>
            <p className="sr-only">{t("pages.groups.loadingGroups")}</p>
            <GroupListSkeleton />
          </>
        ) : groups.length > 0 ? (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupCard
                  groupId={group.id}
                  key={group.id}
                  groupName={group.groupName}
                  groupType={group.groupType}
                  description={group.description}
                  isMember={group.isMember}
                  membershipStatus={group.membershipStatus}
                  memberCount={group._count.members}
                  postCount={group._count.posts}
                  coverUrl={group.coverUrl}
                  joinGroup={handleJoinGroup}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <GroupPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40">
              <Users size={22} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {filter === "MY"
                ? t("pages.groups.emptyMyGroups")
                : t("pages.groups.emptySearch")}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {filter === "MY"
                ? t("pages.groups.emptyMyGroupsDescription")
                : t("pages.groups.emptySearchDescription")}
            </p>
          </div>
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
