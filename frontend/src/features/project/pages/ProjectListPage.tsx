import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Input from "@/components/shared/Input";
import Pagination from "@/components/shared/Pagination";
import { projectApi } from "@/features/project/api/project.api";
import CreateProjectModal from "@/features/project/components/CreateProjectModal";
import ProjectCard from "@/features/project/components/ProjectCard";
import type {
  CreateProjectPayload,
  ProjectListItem,
} from "@/features/project/types/project.type";
import type { Pagination as PaginationData } from "@/features/admin/types/admin.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

export default function ProjectListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchProjects = async (targetPage = page, targetKeyword = keyword) => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await projectApi.getProjects({
        page: targetPage,
        keyword: targetKeyword || undefined,
      });
      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (error) {
      setProjects([]);
      setPagination(null);
      setLoadFailed(true);
      toastApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(page, keyword);
  }, [page, keyword]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  const handleCreate = async (data: CreateProjectPayload) => {
    setCreating(true);
    try {
      const response = await projectApi.createProject(data);
      toast.success(t("pages.projects.created"));
      setCreateOpen(false);
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      toastApiError(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <main className="min-h-[calc(100svh-3.5rem)] w-full px-4 py-6 sm:px-6 md:min-h-svh md:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("pages.projects.title")}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              {t("pages.projects.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Plus size={16} />
            {t("pages.projects.create")}
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="mb-6 flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder={t("pages.projects.searchPlaceholder")}
            aria-label={t("pages.projects.searchPlaceholder")}
          />
          <button
            type="submit"
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Search className="size-4" />
            {t("pages.projects.search")}
          </button>
        </form>

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : loadFailed ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <h2 className="text-base font-semibold text-slate-800">
              {t("pages.projects.loadFailed")}
            </h2>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
              <Pagination pagination={pagination} onPageChange={setPage} />
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
              <FolderKanban size={22} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">
              {t("pages.projects.empty")}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {t("pages.projects.emptyDescription")}
            </p>
          </div>
        )}
      </main>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        submitting={creating}
      />
    </>
  );
}
