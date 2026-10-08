import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import PaginationBar from "@/components/shared/Pagination";
import {
  FilterSelect,
  SearchField,
  SearchFilter,
  searchButtonClass,
} from "@/components/shared/SearchFilter";
import Textarea from "@/components/shared/Textarea";
import type { Pagination } from "@/features/admin/types/admin.type";
import { projectTemplateApi } from "@/features/project-template/api/project-template.api";
import type {
  TemplateListItem,
  TemplateStatus,
} from "@/features/project-template/types/project-template.type";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";

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

      <SearchFilter>
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 flex-wrap gap-2">
          <SearchField
            placeholder={t("pages.admin.projectTemplateSearchPlaceholder")}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="max-w-sm"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TemplateStatus | "")
            }
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
          </FilterSelect>
          <Button type="submit" className={searchButtonClass}>
            {t("common.search")}
          </Button>
        </form>
        <Button
          className="h-10 cursor-pointer bg-primary px-4 text-white hover:bg-primary/90"
          onClick={() => setCreateOpen(true)}
        >
          {t("pages.admin.projectTemplateCreate")}
        </Button>
      </SearchFilter>

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
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <Modal
        open={createOpen}
        title={t("pages.admin.projectTemplateCreate")}
        onClose={() => {
          if (!creating) setCreateOpen(false);
        }}
        formId="create-project-template"
        confirmText={t("common.confirm")}
        loading={creating}
        size="md"
      >
        <form
          id="create-project-template"
          onSubmit={handleCreate}
          className="space-y-4"
        >
          <Field
            label={t("pages.admin.projectTemplateKey")}
            hint={t("pages.admin.projectTemplateKeyHint")}
            htmlFor="create-template-key"
            required
          >
            <Input
              id="create-template-key"
              value={createKey}
              onChange={(e) => setCreateKey(e.target.value.toUpperCase())}
              placeholder="SOFTWARE_DEVELOPMENT"
              required
            />
          </Field>
          <Field
            label={t("pages.admin.projectTemplateName")}
            htmlFor="create-template-name"
            required
          >
            <Input
              id="create-template-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
          </Field>
          <Field
            label={t("pages.admin.projectTemplateDescription")}
            htmlFor="create-template-description"
          >
            <Textarea
              id="create-template-description"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="min-h-20"
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={confirmDeleteId !== null}
        title={t("pages.admin.projectTemplateDeleteTitle")}
        description={t("pages.admin.projectTemplateDeleteDescription")}
        confirmText={t("common.delete")}
        loading={deletingId !== null}
        variant="danger"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
