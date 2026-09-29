import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ConfirmModal from "@/components/common/ConfirmModal";
import AdminPagination from "@/features/admin/components/AdminPagination";
import type { Pagination } from "@/features/admin/types/admin.type";
import { projectTemplateApi } from "@/features/project-template/api/project-template.api";
import type {
  TemplateListItem,
  TemplateStatus,
} from "@/features/project-template/types/project-template.type";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const selectClass =
  "h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none";

function statusBadgeVariant(status: TemplateStatus) {
  if (status === "ACTIVE") return "active" as const;
  if (status === "ARCHIVED") return "inactive" as const;
  return "outline" as const;
}

export default function ProjectTemplateListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createKey, setCreateKey] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  const fetchTemplates = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await projectTemplateApi.getTemplates({
        page: targetPage,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      setTemplates(res.data.templates);
      setPagination(res.data.pagination);
    } catch (error) {
      toastApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTemplates(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await projectTemplateApi.createTemplate({
        key: createKey,
        name: createName,
        description: createDescription || undefined,
      });
      toast.success(t("pages.admin.projectTemplateCreated"));
      setCreateOpen(false);
      setCreateKey("");
      setCreateName("");
      setCreateDescription("");
      navigate(`/admin/project-templates/${res.data.id}`);
    } catch (error) {
      toastApiError(error);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await projectTemplateApi.deleteTemplate(confirmDeleteId);
      toast.success(t("pages.admin.projectTemplateDeleted"));
      setConfirmDeleteId(null);
      fetchTemplates();
    } catch (error) {
      toastApiError(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">
        {t("pages.admin.projectTemplatesTitle")}
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder={t("pages.admin.projectTemplateSearchPlaceholder")}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TemplateStatus | "")
            }
            className={selectClass}
          >
            <option value="">
              {t("pages.admin.projectTemplateAllStatuses")}
            </option>
            <option value="DRAFT">
              {t("pages.admin.projectTemplateStatusDraft")}
            </option>
            <option value="ACTIVE">
              {t("pages.admin.projectTemplateStatusActive")}
            </option>
            <option value="ARCHIVED">
              {t("pages.admin.projectTemplateStatusArchived")}
            </option>
          </select>
          <Button
            type="submit"
            className="cursor-pointer text-white bg-primary hover:bg-primary/90"
          >
            {t("common.search")}
          </Button>
        </form>
        <Button
          className="cursor-pointer text-white bg-primary hover:bg-primary/90"
          onClick={() => setCreateOpen(true)}
        >
          {t("pages.admin.projectTemplateCreate")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          {t("pages.admin.projectTemplateEmpty")}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.admin.projectTemplateName")}</TableHead>
                <TableHead>{t("pages.admin.projectTemplateKey")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("pages.admin.projectTemplateVersion")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.key}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(template.status)}>
                      {template.status === "DRAFT"
                        ? t("pages.admin.projectTemplateStatusDraft")
                        : template.status === "ACTIVE"
                          ? t("pages.admin.projectTemplateStatusActive")
                          : t("pages.admin.projectTemplateStatusArchived")}
                    </Badge>
                  </TableCell>
                  <TableCell>v{template.version}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/project-templates/${template.id}`}>
                          {t("common.details")}
                        </Link>
                      </Button>
                      {template.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant="locked"
                          disabled={deletingId === template.id}
                          onClick={() => setConfirmDeleteId(template.id)}
                        >
                          {t("common.delete")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <AdminPagination pagination={pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pages.admin.projectTemplateCreate")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="mb-3">
              <label className="mb-1 block text-sm text-gray-600">
                {t("pages.admin.projectTemplateKey")}
              </label>
              <Input
                value={createKey}
                onChange={(e) => setCreateKey(e.target.value.toUpperCase())}
                placeholder="SOFTWARE_DEVELOPMENT"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("pages.admin.projectTemplateKeyHint")}
              </p>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm text-gray-600">
                {t("pages.admin.projectTemplateName")}
              </label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm text-gray-600">
                {t("pages.admin.projectTemplateDescription")}
              </label>
              <Input
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="cursor-pointer text-white bg-primary hover:bg-primary/90"
              >
                {creating ? t("common.processing") : t("common.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title={t("pages.admin.projectTemplateDeleteTitle")}
        description={t("pages.admin.projectTemplateDeleteDescription")}
        confirmText={t("common.delete")}
        loading={deletingId !== null}
        variant="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
