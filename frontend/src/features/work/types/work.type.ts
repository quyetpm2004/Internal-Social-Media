export type WorkScope = "mine" | "assigned";
export type WorkRole = "ASSIGNEE" | "REVIEWER" | "REPORTER";
export type WorkDue = "overdue" | "today" | "week" | "none";
export type WorkCategory = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type MyTask = {
  id: number;
  code: string;
  title: string;
  project: { id: number; name: string };
  myRole: WorkRole;
  status: {
    id: number;
    name: string;
    key: string;
    color: string | null;
    category: WorkCategory;
  };
  dueDate: string | null;
};

export type MyTaskListResponse = {
  items: MyTask[];
  counts: { mine: number; assigned: number };
};

export type MyTaskQuery = {
  scope: WorkScope;
  q?: string;
  projectId?: number;
  role?: WorkRole;
  due?: WorkDue;
};
