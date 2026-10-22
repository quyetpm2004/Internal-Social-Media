export type OverviewCategory = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type OverviewPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type OverviewProgressItem =
  | {
      kind: "category";
      category: OverviewCategory;
      count: number;
    }
  | {
      kind: "status";
      id: number;
      name: string;
      color: string | null;
      count: number;
    };

export type ProjectOverviewData = {
  updatedAt: string;
  summary: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    cancelled: number;
    overdue: number;
    urgentOpen: number;
  };
  time: null;
  progress: {
    percent: number;
    mode: "category" | "status";
    items: OverviewProgressItem[];
  };
  priorities: Array<{
    priority: OverviewPriority;
    count: number;
    percent: number;
  }>;
  weekly: Array<{
    weekStart: string;
    completed: number;
    created: number;
  }>;
  members: Array<{
    userId: number;
    name: string;
    done: number;
    assigned: number;
    percent: number;
  }>;
  upcoming: Array<{
    id: number;
    code: string;
    title: string;
    dueDate: string | null;
  }>;
  timeBudget: null;
  attention: {
    total: number;
    items: Array<{
      id: number;
      code: string;
      title: string;
      dueDate: string | null;
      priority: OverviewPriority;
      reason: "OVERDUE" | "URGENT";
    }>;
  };
};
