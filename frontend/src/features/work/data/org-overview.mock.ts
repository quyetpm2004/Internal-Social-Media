export type PeriodKey = "week" | "month" | "quarter";

export type MetricTone = "blue" | "sky" | "rose" | "violet" | "amber";

export type MetricItem = {
  id: string;
  labelKey: string;
  value: string;
  hintKey?: string;
  hintValue?: string;
  tone: MetricTone;
};

export type CompareTone = "neutral" | "good" | "bad";

export type CompareItem = {
  id: string;
  labelKey: string;
  value: string;
  previous: string;
  delta: string;
  tone: CompareTone;
};

export type ProjectRow = {
  id: string;
  name: string;
  sprint: string;
  start: string;
  end: string;
  progress: number;
  issuesLeft: number;
  tasksDone: number;
  tasksTotal: number;
  tasksLate: number;
  status: "slow" | "onTrack" | "done";
  archived?: boolean;
};

export type DeptMember = {
  name: string;
  idle: number;
  late: number;
};

export type DepartmentRow = {
  id: string;
  name: string;
  headcount: number;
  idle: number;
  late: number;
  members: DeptMember[];
};

export type SlowTask = {
  id: string;
  title: { vi: string; en: string };
  since: string;
};

export type FreshItem = {
  id: string;
  title: { vi: string; en: string };
  minutesAgo: number;
};

export type WorkloadRow = {
  id: string;
  name: string;
  inProject: number;
  outside: number;
};

export type ActivityItem = {
  id: string;
  message: { vi: string; en: string };
  time: { vi: string; en: string };
  project: string;
  tone: "blue" | "emerald" | "violet" | "amber";
};

export type PeriodSnapshot = {
  metrics: MetricItem[];
  alerts: MetricItem[];
  compare: CompareItem[];
};

const week: PeriodSnapshot = {
  metrics: [
    {
      id: "on-time",
      labelKey: "onTime",
      value: "72%",
      hintKey: "onTimeHint",
      tone: "blue",
    },
    {
      id: "running",
      labelKey: "running",
      value: "8",
      hintKey: "runningHint",
      hintValue: "6",
      tone: "sky",
    },
    {
      id: "late-projects",
      labelKey: "lateProjects",
      value: "3",
      hintKey: "lateProjectsHint",
      tone: "rose",
    },
    {
      id: "open-issues",
      labelKey: "openIssues",
      value: "14",
      hintKey: "openIssuesHint",
      tone: "rose",
    },
    {
      id: "slow-people",
      labelKey: "slowPeople",
      value: "6",
      hintKey: "slowPeopleHint",
      tone: "violet",
    },
  ],
  alerts: [
    {
      id: "overdue-tasks",
      labelKey: "overdueTasks",
      value: "11",
      tone: "rose",
    },
    {
      id: "sprints-ending",
      labelKey: "sprintsEnding",
      value: "1",
      tone: "amber",
    },
    {
      id: "unassigned",
      labelKey: "unassigned",
      value: "7",
      tone: "violet",
    },
    {
      id: "no-sprint",
      labelKey: "noSprint",
      value: "2",
      tone: "sky",
    },
  ],
  compare: [
    {
      id: "tasks",
      labelKey: "compareTasks",
      value: "18",
      previous: "11",
      delta: "+7",
      tone: "good",
    },
    {
      id: "issues",
      labelKey: "compareIssues",
      value: "9",
      previous: "8",
      delta: "+1",
      tone: "neutral",
    },
    {
      id: "overdue-rate",
      labelKey: "compareOverdue",
      value: "24%",
      previous: "18%",
      delta: "+6%",
      tone: "bad",
    },
    {
      id: "avg-time",
      labelKey: "compareAvg",
      value: "1.5",
      previous: "3",
      delta: "−1.5",
      tone: "good",
    },
    {
      id: "reopen",
      labelKey: "compareReopen",
      value: "8%",
      previous: "8%",
      delta: "0%",
      tone: "neutral",
    },
  ],
};

const month: PeriodSnapshot = {
  metrics: [
    {
      id: "on-time",
      labelKey: "onTime",
      value: "68%",
      hintKey: "onTimeHint",
      tone: "blue",
    },
    {
      id: "running",
      labelKey: "running",
      value: "8",
      hintKey: "runningHint",
      hintValue: "5",
      tone: "sky",
    },
    {
      id: "late-projects",
      labelKey: "lateProjects",
      value: "4",
      hintKey: "lateProjectsHint",
      tone: "rose",
    },
    {
      id: "open-issues",
      labelKey: "openIssues",
      value: "27",
      hintKey: "openIssuesHint",
      tone: "rose",
    },
    {
      id: "slow-people",
      labelKey: "slowPeople",
      value: "9",
      hintKey: "slowPeopleHint",
      tone: "violet",
    },
  ],
  alerts: [
    { id: "overdue-tasks", labelKey: "overdueTasks", value: "23", tone: "rose" },
    { id: "sprints-ending", labelKey: "sprintsEnding", value: "2", tone: "amber" },
    { id: "unassigned", labelKey: "unassigned", value: "12", tone: "violet" },
    { id: "no-sprint", labelKey: "noSprint", value: "2", tone: "sky" },
  ],
  compare: [
    {
      id: "tasks",
      labelKey: "compareTasks",
      value: "64",
      previous: "51",
      delta: "+13",
      tone: "good",
    },
    {
      id: "issues",
      labelKey: "compareIssues",
      value: "31",
      previous: "22",
      delta: "+9",
      tone: "bad",
    },
    {
      id: "overdue-rate",
      labelKey: "compareOverdue",
      value: "19%",
      previous: "27%",
      delta: "−8%",
      tone: "good",
    },
    {
      id: "avg-time",
      labelKey: "compareAvg",
      value: "2",
      previous: "2.5",
      delta: "−0.5",
      tone: "good",
    },
    {
      id: "reopen",
      labelKey: "compareReopen",
      value: "5%",
      previous: "11%",
      delta: "−6%",
      tone: "good",
    },
  ],
};

const quarter: PeriodSnapshot = {
  metrics: [
    {
      id: "on-time",
      labelKey: "onTime",
      value: "74%",
      hintKey: "onTimeHint",
      tone: "blue",
    },
    {
      id: "running",
      labelKey: "running",
      value: "8",
      hintKey: "runningHint",
      hintValue: "6",
      tone: "sky",
    },
    {
      id: "late-projects",
      labelKey: "lateProjects",
      value: "2",
      hintKey: "lateProjectsHint",
      tone: "rose",
    },
    {
      id: "open-issues",
      labelKey: "openIssues",
      value: "41",
      hintKey: "openIssuesHint",
      tone: "rose",
    },
    {
      id: "slow-people",
      labelKey: "slowPeople",
      value: "7",
      hintKey: "slowPeopleHint",
      tone: "violet",
    },
  ],
  alerts: [
    { id: "overdue-tasks", labelKey: "overdueTasks", value: "16", tone: "rose" },
    { id: "sprints-ending", labelKey: "sprintsEnding", value: "0", tone: "amber" },
    { id: "unassigned", labelKey: "unassigned", value: "9", tone: "violet" },
    { id: "no-sprint", labelKey: "noSprint", value: "1", tone: "sky" },
  ],
  compare: [
    {
      id: "tasks",
      labelKey: "compareTasks",
      value: "186",
      previous: "154",
      delta: "+32",
      tone: "good",
    },
    {
      id: "issues",
      labelKey: "compareIssues",
      value: "74",
      previous: "81",
      delta: "−7",
      tone: "good",
    },
    {
      id: "overdue-rate",
      labelKey: "compareOverdue",
      value: "15%",
      previous: "21%",
      delta: "−6%",
      tone: "good",
    },
    {
      id: "avg-time",
      labelKey: "compareAvg",
      value: "2.2",
      previous: "3.1",
      delta: "−0.9",
      tone: "good",
    },
    {
      id: "reopen",
      labelKey: "compareReopen",
      value: "4%",
      previous: "6%",
      delta: "−2%",
      tone: "good",
    },
  ],
};

export const periodSnapshots: Record<PeriodKey, PeriodSnapshot> = {
  week,
  month,
  quarter,
};

export const periodRanges: Record<PeriodKey, { from: string; to: string }> = {
  week: { from: "2026-10-02", to: "2026-10-08" },
  month: { from: "2026-10-01", to: "2026-10-08" },
  quarter: { from: "2026-07-01", to: "2026-10-08" },
};

export const projectRows: ProjectRow[] = [
  {
    id: "p1",
    name: "Cổng thông tin nội bộ",
    sprint: "Sprint 14",
    start: "01/09/26",
    end: "30/09/26",
    progress: 62,
    issuesLeft: 4,
    tasksDone: 18,
    tasksTotal: 29,
    tasksLate: 3,
    status: "slow",
  },
  {
    id: "p2",
    name: "CollabNet Mobile",
    sprint: "Sprint 8",
    start: "15/09/26",
    end: "12/10/26",
    progress: 41,
    issuesLeft: 6,
    tasksDone: 11,
    tasksTotal: 27,
    tasksLate: 2,
    status: "slow",
  },
  {
    id: "p3",
    name: "Luồng duyệt bài viết",
    sprint: "Sprint 6",
    start: "20/09/26",
    end: "18/10/26",
    progress: 78,
    issuesLeft: 1,
    tasksDone: 21,
    tasksTotal: 24,
    tasksLate: 0,
    status: "onTrack",
  },
  {
    id: "p4",
    name: "Kho tài liệu phòng ban",
    sprint: "Sprint 3",
    start: "01/10/26",
    end: "31/10/26",
    progress: 22,
    issuesLeft: 2,
    tasksDone: 4,
    tasksTotal: 18,
    tasksLate: 1,
    status: "slow",
  },
  {
    id: "p5",
    name: "Chat nội bộ v2",
    sprint: "Sprint 11",
    start: "05/09/26",
    end: "02/10/26",
    progress: 91,
    issuesLeft: 0,
    tasksDone: 32,
    tasksTotal: 34,
    tasksLate: 0,
    status: "onTrack",
  },
  {
    id: "p6",
    name: "Báo cáo tuần tự động",
    sprint: "—",
    start: "01/10/26",
    end: "20/10/26",
    progress: 8,
    issuesLeft: 0,
    tasksDone: 1,
    tasksTotal: 12,
    tasksLate: 0,
    status: "onTrack",
  },
  {
    id: "p7",
    name: "Onboarding nhân sự mới",
    sprint: "Sprint 2",
    start: "10/09/26",
    end: "10/10/26",
    progress: 55,
    issuesLeft: 3,
    tasksDone: 9,
    tasksTotal: 16,
    tasksLate: 2,
    status: "slow",
  },
  {
    id: "p8",
    name: "Sự kiện nội bộ Q3",
    sprint: "Sprint 4",
    start: "01/07/26",
    end: "15/09/26",
    progress: 100,
    issuesLeft: 0,
    tasksDone: 20,
    tasksTotal: 20,
    tasksLate: 0,
    status: "done",
    archived: true,
  },
  {
    id: "p9",
    name: "Khảo sát gắn kết",
    sprint: "Sprint 1",
    start: "01/06/26",
    end: "30/06/26",
    progress: 100,
    issuesLeft: 0,
    tasksDone: 8,
    tasksTotal: 8,
    tasksLate: 0,
    status: "done",
    archived: true,
  },
];

export const departments: DepartmentRow[] = [
  {
    id: "eng",
    name: "Kỹ thuật",
    headcount: 12,
    idle: 1,
    late: 3,
    members: [
      { name: "Đinh Văn An", idle: 0, late: 2 },
      { name: "Hà Quốc Hưng", idle: 0, late: 1 },
      { name: "Lưu Văn Việt", idle: 1, late: 0 },
    ],
  },
  {
    id: "product",
    name: "Sản phẩm",
    headcount: 6,
    idle: 0,
    late: 1,
    members: [
      { name: "Nguyễn Ngọc Huy", idle: 0, late: 1 },
      { name: "Ngô Thu Hà", idle: 0, late: 0 },
    ],
  },
  {
    id: "hr",
    name: "Nhân sự",
    headcount: 4,
    idle: 1,
    late: 0,
    members: [
      { name: "Nguyễn Thu Hiền", idle: 1, late: 0 },
      { name: "Trần Mai Chi", idle: 0, late: 0 },
    ],
  },
  {
    id: "sales",
    name: "Kinh doanh",
    headcount: 8,
    idle: 2,
    late: 2,
    members: [
      { name: "Phạm Gia Bảo", idle: 1, late: 1 },
      { name: "Lê Khánh Linh", idle: 1, late: 1 },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    headcount: 5,
    idle: 0,
    late: 1,
    members: [
      { name: "Võ Minh Khang", idle: 0, late: 1 },
      { name: "Đỗ Lan Anh", idle: 0, late: 0 },
    ],
  },
  {
    id: "ops",
    name: "Vận hành",
    headcount: 3,
    idle: 0,
    late: 0,
    members: [{ name: "Bùi Hoàng Long", idle: 0, late: 0 }],
  },
];

export const slowTasks: SlowTask[] = [
  {
    id: "s1",
    title: {
      vi: "Làm tài liệu chỉ tiêu kỹ thuật cho module dự án",
      en: "Write the technical spec for the project module",
    },
    since: "13/08",
  },
  {
    id: "s2",
    title: {
      vi: "Bổ sung tính năng lọc theo kỳ trên tổng quan",
      en: "Add period filters on the overview",
    },
    since: "18/08",
  },
  {
    id: "s3",
    title: {
      vi: "Sửa nhãn và kiểm tra form thêm thành viên",
      en: "Fix labels and validate the add-member form",
    },
    since: "31/08",
  },
  {
    id: "s4",
    title: {
      vi: "Xây màn hình trợ giúp quản lý trung tâm",
      en: "Build the workspace admin help screen",
    },
    since: "07/09",
  },
  {
    id: "s5",
    title: {
      vi: "Đồng bộ trạng thái task khi đổi sprint",
      en: "Sync task status when a sprint changes",
    },
    since: "19/09",
  },
  {
    id: "s6",
    title: {
      vi: "Gửi nhắc việc quá hạn vào đầu giờ sáng",
      en: "Send the morning reminder for overdue work",
    },
    since: "28/09",
  },
];

export const freshItems: FreshItem[] = [
  {
    id: "f1",
    title: {
      vi: "Lỗi khi nhập file Excel chứa ký tự đặc biệt",
      en: "Import fails when the Excel file has special characters",
    },
    minutesAgo: 2,
  },
  {
    id: "f2",
    title: {
      vi: "Thiếu trạng thái nháp cho bài viết chờ duyệt",
      en: "Missing draft state for posts waiting for review",
    },
    minutesAgo: 18,
  },
  {
    id: "f3",
    title: {
      vi: "Thêm cột tiến độ vào danh sách dự án",
      en: "Add a progress column to the project list",
    },
    minutesAgo: 46,
  },
  {
    id: "f4",
    title: {
      vi: "Không lưu được người phụ trách khi tạo task",
      en: "Assignee is not saved when a task is created",
    },
    minutesAgo: 95,
  },
];

export const chartLabels = ["28/09", "29/09", "30/09", "01/10", "02/10"];

export const chartSeries = [
  {
    key: "newTasks",
    labelKey: "seriesNewTasks",
    color: "#16a34a",
    values: [70, 160, 210, 140, 0],
  },
  {
    key: "slowTasks",
    labelKey: "seriesSlowTasks",
    color: "#e11d48",
    values: [4, 8, 12, 9, 0],
  },
  {
    key: "newIssues",
    labelKey: "seriesNewIssues",
    color: "#7c3aed",
    values: [12, 20, 36, 240, 0],
  },
  {
    key: "resolved",
    labelKey: "seriesResolved",
    color: "#0f766e",
    values: [2, 5, 8, 6, 0],
  },
];

export const workload: WorkloadRow[] = [
  { id: "w1", name: "Đinh Văn An", inProject: 8, outside: 1 },
  { id: "w2", name: "Hà Quốc Hưng", inProject: 6, outside: 0 },
  { id: "w3", name: "Nguyễn Ngọc Huy", inProject: 7, outside: 2 },
  { id: "w4", name: "Ngô Thu Hà", inProject: 5, outside: 0 },
  { id: "w5", name: "Phạm Gia Bảo", inProject: 4, outside: 3 },
  { id: "w6", name: "Lê Khánh Linh", inProject: 3, outside: 1 },
  { id: "w7", name: "Võ Minh Khang", inProject: 6, outside: 0 },
  { id: "w8", name: "Bùi Hoàng Long", inProject: 2, outside: 0 },
];

export const activities: ActivityItem[] = [
  {
    id: "a1",
    message: {
      vi: "Tuấn Anh đã cập nhật issue “Booking Settings: trạng thái không viết hoa tất cả các chữ”.",
      en: "Tuan Anh updated issue “Booking Settings: status is not fully capitalized”.",
    },
    time: { vi: "1 phút trước", en: "1 minute ago" },
    project: "CollabNet Mobile",
    tone: "emerald",
  },
  {
    id: "a2",
    message: {
      vi: "Ngọc Tuấn đổi trạng thái “Sắp xếp mối liên hệ đến” từ đang bàn sang đang chờ.",
      en: "Ngoc Tuan moved “Sort incoming contacts” from in discussion to waiting.",
    },
    time: { vi: "1 phút trước", en: "1 minute ago" },
    project: "Cổng thông tin nội bộ",
    tone: "blue",
  },
  {
    id: "a3",
    message: {
      vi: "Thu Hương tạo issue “Lỗi khi import Excel chứa ký tự đặc biệt”.",
      en: "Thu Huong opened issue “Excel import fails on special characters”.",
    },
    time: { vi: "2 phút trước", en: "2 minutes ago" },
    project: "Kho tài liệu phòng ban",
    tone: "violet",
  },
  {
    id: "a4",
    message: {
      vi: "Ngọc Tuấn đổi trạng thái “Tỷ lệ hoàn thành” sang đã phát hiện.",
      en: "Ngoc Tuan set “Completion rate” to identified.",
    },
    time: { vi: "8 phút trước", en: "8 minutes ago" },
    project: "Báo cáo tuần tự động",
    tone: "amber",
  },
  {
    id: "a5",
    message: {
      vi: "Sinh An đổi trạng thái “[QLK] Nháp sẽ phát hành” sang đang làm.",
      en: "Sinh An moved “[QLK] Draft to publish” to in progress.",
    },
    time: { vi: "27 phút trước", en: "27 minutes ago" },
    project: "Luồng duyệt bài viết",
    tone: "blue",
  },
  {
    id: "a6",
    message: {
      vi: "Lan Anh giao task “Banner chiến dịch nội bộ” cho Minh Khang.",
      en: "Lan Anh assigned “Internal campaign banner” to Minh Khang.",
    },
    time: { vi: "1 giờ trước", en: "1 hour ago" },
    project: "Onboarding nhân sự mới",
    tone: "emerald",
  },
];

export const avatarTones = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-indigo-500",
  "bg-teal-600",
];
