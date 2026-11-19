import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Building2,
  Crown,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ConfirmModal from "@/components/common/ConfirmModal";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import StatCard from "@/components/shared/dashboard/StatCard";
import Select from "@/components/shared/Select";
import {
  departmentOrgApi,
  type Appointee,
  type OrgDepartment,
  type OrgMember,
} from "@/features/department/api/department-org.api";
import { toastApiError } from "@/features/project-template/utils/api-error";

const SEARCH_DEBOUNCE_MS = 350;

function ManagerLine({
  department,
  onAppoint,
  onDismiss,
}: {
  department: OrgDepartment;
  onAppoint: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const manager = department.manager;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Crown
          className={manager ? "size-4 text-amber-500" : "size-4 text-slate-300"}
        />
        <span className="truncate font-medium text-slate-700">
          {manager?.fullName ?? t("director.noManager")}
        </span>
      </div>
      <div className="flex gap-2">
        {!manager && (
          <button
            type="button"
            onClick={onAppoint}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            {t("director.appoint")}
          </button>
        )}
        {manager && (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            <UserMinus className="size-3.5" />
            {t("director.dismiss")}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Giám đốc: quản lý cơ cấu tổ chức. Bổ nhiệm/miễn nhiệm trưởng phòng là một thao tác
 * duy nhất ở backend (đổi role, gán managerId, đổi chức danh, chuyển phòng).
 */
export default function DepartmentsManagePage() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const [formTarget, setFormTarget] = useState<OrgDepartment | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [deleting, setDeleting] = useState<OrgDepartment | null>(null);
  const [dismissing, setDismissing] = useState<OrgDepartment | null>(null);

  const [appointTarget, setAppointTarget] = useState<OrgDepartment | null>(null);
  const [appointQuery, setAppointQuery] = useState("");
  const [appointees, setAppointees] = useState<Appointee[]>([]);
  const [candidateId, setCandidateId] = useState<number | null>(null);

  const [transferTarget, setTransferTarget] = useState<OrgDepartment | null>(null);
  const [transferMembers, setTransferMembers] = useState<OrgMember[]>([]);
  const [transferTo, setTransferTo] = useState<Record<number, string>>({});

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    departmentOrgApi
      .list()
      .then((response) => {
        if (!cancelled) setDepartments(response.data);
      })
      .catch((error: unknown) => {
        if (!cancelled) toastApiError(error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!appointTarget) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      departmentOrgApi
        .listAppointees({ search: appointQuery.trim() || undefined, limit: 10 })
        .then((response) => {
          if (!cancelled) setAppointees(response.data.items);
        })
        .catch((error: unknown) => {
          if (!cancelled) toastApiError(error);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [appointTarget, appointQuery]);

  useEffect(() => {
    if (!transferTarget) return;
    let cancelled = false;
    departmentOrgApi
      .listMembers(transferTarget.id)
      .then((response) => {
        if (!cancelled) setTransferMembers(response.data.items);
      })
      .catch((error: unknown) => {
        if (!cancelled) toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [transferTarget]);

  const totals = useMemo(
    () => ({
      departments: departments.length,
      employees: departments.reduce((sum, item) => sum + item._count.users, 0),
      managers: departments.filter((item) => item.manager).length,
    }),
    [departments],
  );

  const openForm = (target: OrgDepartment | "new") => {
    setFormTarget(target);
    setName(target === "new" ? "" : target.name);
    setDescription(target === "new" ? "" : (target.description ?? ""));
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true);
    try {
      await action();
      toast.success(success);
      reload();
      return true;
    } catch (error) {
      toastApiError(error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveForm = async () => {
    if (!formTarget || !name.trim()) return;
    const payload = { name: name.trim(), description: description.trim() || null };
    const ok = await run(
      () =>
        formTarget === "new"
          ? departmentOrgApi.create(payload)
          : departmentOrgApi.update(formTarget.id, payload),
      t(formTarget === "new" ? "director.toast.created" : "director.toast.updated"),
    );
    if (ok) setFormTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const ok = await run(
      () => departmentOrgApi.remove(deleting.id),
      t("director.toast.deleted"),
    );
    if (ok) setDeleting(null);
  };

  const confirmDismiss = async () => {
    if (!dismissing) return;
    const name = dismissing.manager?.fullName ?? "";
    const ok = await run(
      () => departmentOrgApi.dismissManager(dismissing.id),
      t("director.toast.dismissed", { name }),
    );
    if (ok) setDismissing(null);
  };

  const confirmAppoint = async () => {
    if (!appointTarget || candidateId === null) return;
    const person = appointees.find((item) => item.id === candidateId);
    const ok = await run(
      () => departmentOrgApi.appointManager(appointTarget.id, candidateId),
      t("director.toast.appointed", { name: person?.name ?? "" }),
    );
    if (ok) {
      setAppointTarget(null);
      setCandidateId(null);
    }
  };

  const transfer = async (member: OrgMember) => {
    if (!transferTarget) return;
    const toId = Number(transferTo[member.id]);
    if (!toId) return;
    const ok = await run(
      () => departmentOrgApi.transferMember(transferTarget.id, member.id, toId),
      t("director.toast.transferred", { name: member.name }),
    );
    if (ok) {
      setTransferMembers((list) => list.filter((item) => item.id !== member.id));
    }
  };

  return (
    <main className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {t("director.title")}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{t("director.subtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openForm("new")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Plus size={16} />
          {t("director.create")}
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("director.summary.departments")}
          value={String(totals.departments)}
          hint={t("director.summary.departmentsHint", {
            count: totals.departments - totals.managers,
          })}
          icon={<Building2 className="size-4" />}
          tone="blue"
        />
        <StatCard
          label={t("director.summary.employees")}
          value={String(totals.employees)}
          hint={t("director.summary.employeesHint", {
            count: totals.departments
              ? Math.round(totals.employees / totals.departments)
              : 0,
          })}
          icon={<Users className="size-4" />}
          tone="violet"
        />
        <StatCard
          label={t("director.summary.managers")}
          value={String(totals.managers)}
          hint={t("director.summary.managersHint", {
            count: totals.managers,
            total: totals.departments,
          })}
          icon={<Crown className="size-4" />}
          tone="emerald"
        />
      </section>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">{t("common.loading")}</p>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {departments.map((department) => (
            <article
              key={department.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-900">
                    <Link
                      to={`/work/departments/${department.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {department.name}
                    </Link>
                  </h2>
                  {department.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                      {department.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="mr-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Users className="size-3.5" />
                    {department._count.users}
                  </span>
                  <button
                    type="button"
                    aria-label={t("common.edit")}
                    onClick={() => openForm(department)}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={t("common.delete")}
                    onClick={() => setDeleting(department)}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <ManagerLine
                department={department}
                onAppoint={() => {
                  setAppointTarget(department);
                  setAppointQuery("");
                  setCandidateId(null);
                  setAppointees([]);
                }}
                onDismiss={() => setDismissing(department)}
              />

              <button
                type="button"
                onClick={() => {
                  setTransferTarget(department);
                  setTransferMembers([]);
                  setTransferTo({});
                }}
                className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ArrowRightLeft className="size-3.5" />
                {t("director.transfer.open")}
              </button>
            </article>
          ))}
        </section>
      )}

      <Modal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        title={formTarget === "new" ? t("director.create") : t("director.edit")}
        confirmText={t("common.save")}
        confirmDisabled={!name.trim()}
        loading={saving}
        onConfirm={() => void saveForm()}
        variant="primary"
      >
        <div className="space-y-3">
          <Field label={t("director.form.name")} htmlFor="department-name">
            <Input
              id="department-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label={t("director.form.description")} htmlFor="department-description">
            <Input
              id="department-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={appointTarget !== null}
        onClose={() => setAppointTarget(null)}
        title={t("director.appointTitle", { name: appointTarget?.name ?? "" })}
        confirmText={t("director.appoint")}
        confirmDisabled={candidateId === null}
        loading={saving}
        onConfirm={() => void confirmAppoint()}
        variant="primary"
      >
        <div className="space-y-3">
          <Input
            value={appointQuery}
            onChange={(event) => setAppointQuery(event.target.value)}
            placeholder={t("director.form.searchCandidate")}
          />
          <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
            {appointees.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-400">
                {t("director.form.noCandidate")}
              </li>
            )}
            {appointees.map((person) => (
              <li key={person.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="appointee"
                    checked={candidateId === person.id}
                    onChange={() => setCandidateId(person.id)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {person.name}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {person.email} ·{" "}
                      {person.department?.name ?? t("director.form.noDepartment")}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">{t("director.appointHint")}</p>
        </div>
      </Modal>

      <Modal
        open={transferTarget !== null}
        onClose={() => setTransferTarget(null)}
        title={t("director.transfer.title", { name: transferTarget?.name ?? "" })}
        size="xl"
        hideFooter
      >
        {transferMembers.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            {t("director.transfer.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {transferMembers.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {member.name}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {member.position?.name ?? member.email}
                  </span>
                </span>
                {member.isLeader ? (
                  <span className="text-xs text-amber-700">
                    {t("director.transfer.leaderHint")}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-44">
                      <Select
                        value={transferTo[member.id] ?? ""}
                        onChange={(event) =>
                          setTransferTo((current) => ({
                            ...current,
                            [member.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">{t("director.transfer.choose")}</option>
                        {departments
                          .filter((item) => item.id !== transferTarget?.id)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </Select>
                    </div>
                    <button
                      type="button"
                      disabled={!transferTo[member.id] || saving}
                      onClick={() => void transfer(member)}
                      className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("director.transfer.action")}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmModal
        open={dismissing !== null}
        title={t("director.dismissTitle")}
        description={t("director.dismissDescription", {
          name: dismissing?.manager?.fullName ?? "",
          department: dismissing?.name ?? "",
        })}
        confirmText={t("director.dismiss")}
        loading={saving}
        onCancel={() => setDismissing(null)}
        onConfirm={() => void confirmDismiss()}
      />

      <ConfirmModal
        open={deleting !== null}
        title={t("director.deleteTitle")}
        description={t("director.deleteDescription", { name: deleting?.name ?? "" })}
        confirmText={t("common.delete")}
        loading={saving}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
