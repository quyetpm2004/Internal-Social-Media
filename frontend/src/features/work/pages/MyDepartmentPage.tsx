import { useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { departmentMemberApi } from "@/features/department/api/department-member.api";
import { departmentTaskApi } from "@/features/department/api/department-task.api";
import type {
  DepartmentTaskItem,
  DepartmentTaskStatus,
} from "@/features/department/types/department-task.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type MyDepartmentPageProps = {
  view: "members" | "tasks";
};

// Employee chỉ nhận danh sách cơ bản (không có điểm KPI hay khối lượng việc của đồng nghiệp).
type BasicMember = {
  id: number;
  name: string;
  email: string;
  position: { id: number; name: string } | null;
  isLeader: boolean;
};

function MembersTable({ userId }: { userId: number | undefined }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<BasicMember[] | null>(null);
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    let cancelled = false;
    departmentMemberApi
      .list({ page: 1, limit: 50 } as Parameters<typeof departmentMemberApi.list>[0])
      .then((response) => {
        if (cancelled) return;
        setMembers(response.data.items as unknown as BasicMember[]);
        setDepartmentName(response.data.department.name);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMembers([]);
        toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <p className="text-sm text-slate-500">{departmentName}</p>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("myDepartment.columns.name")}</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                {t("myDepartment.columns.email")}
              </th>
              <th className="px-4 py-3 font-medium">{t("myDepartment.columns.position")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members === null && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  {t("common.loading")}
                </td>
              </tr>
            )}
            {members?.map((member) => (
              <tr key={member.id} className={cn(member.id === userId && "bg-primary/5")}>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {member.name}
                  {member.isLeader && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {t("director.positionManager")}
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                  {member.email}
                </td>
                <td className="px-4 py-3 text-slate-600">{member.position?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function TasksTable({ userId }: { userId: number | undefined }) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<DepartmentTaskItem[] | null>(null);
  const [statuses, setStatuses] = useState<DepartmentTaskStatus[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([departmentTaskApi.list(), departmentTaskApi.getConfig()])
      .then(([list, config]) => {
        if (cancelled) return;
        setTasks(list.data.tasks);
        setStatuses(config.data.statuses);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTasks([]);
        toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusName = (id: number) =>
    statuses.find((status) => status.id === id)?.name ?? "";

  // Chỉ được đổi trạng thái việc được giao cho mình; backend cũng kiểm tra lại.
  const changeStatus = async (task: DepartmentTaskItem, value: string) => {
    const statusId = Number(value);
    if (!statusId || statusId === task.statusId) return;
    setSavingId(task.id);
    try {
      await departmentTaskApi.updateStatus(task.id, statusId);
      setTasks((list) =>
        list?.map((item) => (item.id === task.id ? { ...item, statusId } : item)) ??
        list,
      );
      toast.success(t("myDepartment.statusUpdated"));
    } catch (error) {
      toastApiError(error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">{t("myDepartment.columns.task")}</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">
              {t("myDepartment.columns.assignee")}
            </th>
            <th className="px-4 py-3 font-medium">{t("myDepartment.columns.status")}</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">
              {t("myDepartment.columns.due")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks === null && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                {t("common.loading")}
              </td>
            </tr>
          )}
          {tasks?.map((task) => {
            const mine = task.assignee?.id === userId;
            return (
              <tr key={task.id} className={cn(mine && "bg-primary/5")}>
                <td className="px-4 py-3">
                  <span className="mr-2 text-xs text-slate-400">{task.code}</span>
                  <span className="font-medium text-slate-800">{task.title}</span>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                  {task.assignee?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {mine ? (
                    <select
                      value={task.statusId}
                      disabled={savingId === task.id}
                      onChange={(event) => void changeStatus(task, event.target.value)}
                      className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus:border-primary disabled:cursor-wait"
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-700">{statusName(task.statusId)}</span>
                  )}
                  {mine && (
                    <span className="ml-2 text-[11px] text-primary">
                      {t("myDepartment.canUpdate")}
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                  {task.dueDate ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/** Employee: xem nhân sự và công việc phòng mình (chỉ đọc), tự đổi trạng thái việc được giao. */
export default function MyDepartmentPage({ view }: MyDepartmentPageProps) {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.user?.id);

  return (
    <main className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <h1 className="pt-2 text-xl font-bold tracking-tight text-slate-900">
            {t(view === "members" ? "myDepartment.membersTitle" : "myDepartment.tasksTitle")}
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <Eye className="size-3.5" />
          {t("myDepartment.readOnly")}
        </span>
      </header>

      {view === "members" ? <MembersTable userId={userId} /> : <TasksTable userId={userId} />}
    </main>
  );
}
