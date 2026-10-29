import { create } from "zustand";
import {
  departmentInfo,
  departmentMembers,
  departmentStatuses,
  departmentTasks,
  departmentWorkflow,
  memberKpis,
} from "@/features/department/data/department.mock";
import type {
  DepartmentInfo,
  DepartmentMember,
  DepartmentStatus,
  DepartmentTask,
  DepartmentWorkflow,
  MemberInput,
  MemberKpi,
  NewTaskInput,
} from "@/features/department/types/department.type";

type DepartmentState = {
  info: DepartmentInfo;
  members: DepartmentMember[];
  tasks: DepartmentTask[];
  kpis: MemberKpi[];
  workflow: DepartmentWorkflow;
  statuses: DepartmentStatus[];
  addTask: (input: NewTaskInput) => void;
  updateStatus: (taskId: number, statusId: string) => void;
  addMember: (input: MemberInput) => void;
  updateMember: (id: number, input: MemberInput) => void;
  removeMember: (id: number) => void;
  saveTaskConfig: (
    workflow: DepartmentWorkflow,
    statuses: DepartmentStatus[],
  ) => void;
};

export const useDepartmentStore = create<DepartmentState>((set) => ({
  info: departmentInfo,
  members: departmentMembers,
  tasks: departmentTasks,
  kpis: memberKpis,
  workflow: departmentWorkflow,
  statuses: departmentStatuses,
  addTask: (input) =>
    set((state) => {
      const { parentCode, children, attachments, ...fields } = input;
      void parentCode;
      void attachments;
      let nextId = Math.max(0, ...state.tasks.map((task) => task.id));
      const build = (title: string, extra: Partial<DepartmentTask> = {}) => {
        nextId += 1;
        const task: DepartmentTask = {
          ...fields,
          title,
          id: nextId,
          code: `${state.info.code}-${100 + nextId}`,
          progress: 0,
          project: null,
          ...extra,
        };
        return task;
      };
      const parent = build(fields.title);
      const created = children.map((title) =>
        build(title, { description: "", recurrence: "NONE" }),
      );
      return { tasks: [parent, ...created, ...state.tasks] };
    }),
  updateStatus: (taskId, statusId) =>
    set((state) => {
      const category = state.statuses.find(
        (status) => status.id === statusId,
      )?.category;
      return {
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                statusId,
                progress: category === "DONE" ? 100 : task.progress,
              }
            : task,
        ),
      };
    }),
  addMember: (input) =>
    set((state) => ({
      members: [
        ...state.members,
        {
          ...input,
          id: Math.max(0, ...state.members.map((member) => member.id)) + 1,
          role: "MEMBER",
        },
      ],
    })),
  updateMember: (id, input) =>
    set((state) => ({
      members: state.members.map((member) =>
        member.id === id ? { ...member, ...input } : member,
      ),
    })),
  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((member) => member.id !== id),
      kpis: state.kpis.filter((item) => item.memberId !== id),
      tasks: state.tasks.map((task) => ({
        ...task,
        assigneeIds: task.assigneeIds.filter((item) => item !== id),
        reviewerIds: task.reviewerIds.filter((item) => item !== id),
        reporterId: task.reporterId === id ? null : task.reporterId,
      })),
    })),
  saveTaskConfig: (workflow, statuses) => set({ workflow, statuses }),
}));
