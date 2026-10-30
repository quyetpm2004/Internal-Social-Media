import {
  PrismaClient,
  ProjectMilestoneStatus,
  ProjectPhaseStatus,
  ProjectPriority,
  ProjectStatus,
  ProjectVisibility,
  TemplateTaskRole,
  WorkflowStatusCategory,
} from "@prisma/client";
import { clearProjects } from "./project-reset";
import { seedProjectTemplates } from "./project-template.seed";

const IT = "manager.it@company.com";
const HR = "manager.hr@company.com";
const MKT = "manager.mkt@company.com";
const MAI = "employee1@company.com";
const DUY = "employee2@company.com";
const THAO = "employee3@company.com";
const HUNG = "employee4@company.com";
const QUYNH = "employee5@company.com";
const HA = "employee7@company.com";
const BACH = "employee10@company.com";
const LINH = "employee11@company.com";
const TAM = "employee13@company.com";
const BAO = "employee14@company.com";

type ChildWork = {
  title: string;
  description: string;
  typeKey: string;
  statusKey: string;
  priority: ProjectPriority;
  startOffset: number | null;
  dueOffset: number | null;
  estimate: number;
  assignees: string[];
  reviewer?: string;
};

type WorkItem = ChildWork & {
  phase: number;
  reporter: string;
  children?: ChildWork[];
};

type PhasePlan = {
  name: string;
  goal: string;
  startOffset: number;
  endOffset: number;
  status: ProjectPhaseStatus;
};

type MilestonePlan = {
  name: string;
  description: string;
  dueOffset: number;
  status: ProjectMilestoneStatus;
  phase: number;
  taskTitles: string[];
};

type ProjectPlan = {
  templateKey: string;
  name: string;
  description: string;
  visibility: ProjectVisibility;
  priority: ProjectPriority;
  status: ProjectStatus;
  isUrgent?: boolean;
  startOffset: number;
  endOffset: number;
  createdByEmail: string;
  members: { email: string; roleKey: string }[];
  phases: PhasePlan[];
  milestones: MilestonePlan[];
  tasks: WorkItem[];
};

const projects: ProjectPlan[] = [
  {
    templateKey: "SOFTWARE_DELIVERY",
    name: "Cổng thông tin nhân viên",
    description:
      "Xây dựng cổng nội bộ để nhân viên xem thông báo, gửi đơn nghỉ phép và tra cứu chính sách của công ty.",
    visibility: ProjectVisibility.PRIVATE,
    priority: ProjectPriority.HIGH,
    status: ProjectStatus.IN_PROGRESS,
    startOffset: -80,
    endOffset: 57,
    createdByEmail: IT,
    members: [
      { email: IT, roleKey: "PROJECT_MANAGER" },
      { email: MAI, roleKey: "DEVELOPER" },
      { email: DUY, roleKey: "DEVELOPER" },
      { email: THAO, roleKey: "DEVELOPER" },
      { email: HUNG, roleKey: "DEVELOPER" },
      { email: QUYNH, roleKey: "QA" },
    ],
    phases: [
      {
        name: "Khảo sát và thiết kế",
        goal: "Chốt phạm vi với các phòng ban và có bản thiết kế đủ để bắt đầu làm.",
        startOffset: -80,
        endOffset: -40,
        status: ProjectPhaseStatus.COMPLETED,
      },
      {
        name: "Xây dựng phiên bản nội bộ",
        goal: "Hoàn thành đăng nhập, đơn nghỉ phép và bảng tin để phòng Nhân sự dùng thử.",
        startOffset: -37,
        endOffset: 23,
        status: ProjectPhaseStatus.ACTIVE,
      },
      {
        name: "Kiểm thử và triển khai",
        goal: "Chạy nghiệm thu với dữ liệu thật rồi mở cho toàn công ty.",
        startOffset: 26,
        endOffset: 57,
        status: ProjectPhaseStatus.PLANNED,
      },
    ],
    milestones: [
      {
        name: "Chốt phạm vi cổng thông tin",
        description:
          "Các phòng ban đã xác nhận danh sách chức năng của phiên bản đầu.",
        dueOffset: -40,
        status: ProjectMilestoneStatus.REACHED,
        phase: 0,
        taskTitles: [
          "Khảo sát nhu cầu từng phòng ban",
          "Thiết kế luồng đăng ký nghỉ phép",
        ],
      },
      {
        name: "Phát hành thử cho phòng Nhân sự",
        description:
          "Phòng Nhân sự dùng thử đăng nhập, gửi đơn và xem bảng tin trên môi trường nội bộ.",
        dueOffset: 23,
        status: ProjectMilestoneStatus.OPEN,
        phase: 1,
        taskTitles: [
          "Xây dựng đăng nhập bằng tài khoản công ty",
          "Màn hình gửi đơn nghỉ phép",
          "Bảng tin thông báo nội bộ",
        ],
      },
      {
        name: "Mở cho toàn công ty",
        description:
          "Nhân viên các phòng dùng cổng thông tin thay cho biểu mẫu giấy.",
        dueOffset: 57,
        status: ProjectMilestoneStatus.OPEN,
        phase: 2,
        taskTitles: [
          "Kịch bản kiểm thử nghiệm thu",
          "Tài liệu hướng dẫn cho nhân viên",
        ],
      },
    ],
    tasks: [
      {
        title: "Khảo sát nhu cầu từng phòng ban",
        description:
          "Ngồi với trưởng phòng để ghi lại việc nhân viên đang làm trên giấy, email và file tính.",
        typeKey: "FEATURE",
        statusKey: "DONE",
        priority: ProjectPriority.HIGH,
        startOffset: -78,
        dueOffset: -50,
        estimate: 480,
        phase: 0,
        reporter: IT,
        assignees: [MAI],
        reviewer: QUYNH,
        children: [
          {
            title: "Phỏng vấn phòng Nhân sự",
            description:
              "Ghi lại cách phòng Nhân sự đang nhận đơn nghỉ và thông báo nội bộ.",
            typeKey: "FEATURE",
            statusKey: "DONE",
            priority: ProjectPriority.HIGH,
            startOffset: -78,
            dueOffset: -68,
            estimate: 180,
            assignees: [MAI],
          },
          {
            title: "Phỏng vấn phòng Kế toán",
            description:
              "Xem biểu mẫu chấm công và ngày phép mà kế toán đang đối chiếu mỗi tháng.",
            typeKey: "FEATURE",
            statusKey: "DONE",
            priority: ProjectPriority.MEDIUM,
            startOffset: -70,
            dueOffset: -60,
            estimate: 120,
            assignees: [DUY],
          },
          {
            title: "Tổng hợp biểu mẫu đang dùng",
            description:
              "Gom các mẫu đơn và bảng tính thành một danh sách chức năng cần có ở phiên bản đầu.",
            typeKey: "FEATURE",
            statusKey: "DONE",
            priority: ProjectPriority.MEDIUM,
            startOffset: -58,
            dueOffset: -50,
            estimate: 180,
            assignees: [THAO],
          },
        ],
      },
      {
        title: "Thiết kế luồng đăng ký nghỉ phép",
        description:
          "Vẽ các bước nhân viên gửi đơn, trưởng phòng duyệt và phòng Nhân sự xác nhận.",
        typeKey: "FEATURE",
        statusKey: "DONE",
        priority: ProjectPriority.HIGH,
        startOffset: -60,
        dueOffset: -42,
        estimate: 360,
        phase: 0,
        reporter: IT,
        assignees: [THAO],
        reviewer: QUYNH,
        children: [
          {
            title: "Sơ đồ các bước duyệt đơn",
            description:
              "Chỉ rõ đơn đi từ nhân viên sang trưởng phòng rồi mới tới phòng Nhân sự.",
            typeKey: "FEATURE",
            statusKey: "DONE",
            priority: ProjectPriority.HIGH,
            startOffset: -60,
            dueOffset: -50,
            estimate: 120,
            assignees: [THAO],
          },
          {
            title: "Bố cục màn hình đơn nghỉ",
            description:
              "Sắp ô chọn ngày, lý do, người duyệt và phần xem lại số ngày phép còn lại.",
            typeKey: "FEATURE",
            statusKey: "DONE",
            priority: ProjectPriority.MEDIUM,
            startOffset: -52,
            dueOffset: -42,
            estimate: 180,
            assignees: [THAO, MAI],
          },
        ],
      },
      {
        title: "Dựng trang chủ cổng thông tin",
        description:
          "Làm trang đầu với tin nổi bật, lối tắt tới đơn nghỉ và mục tra cứu chính sách.",
        typeKey: "FEATURE",
        statusKey: "DONE",
        priority: ProjectPriority.MEDIUM,
        startOffset: -48,
        dueOffset: -41,
        estimate: 240,
        phase: 0,
        reporter: IT,
        assignees: [THAO, MAI],
        reviewer: QUYNH,
      },
      {
        title: "Xây dựng đăng nhập bằng tài khoản công ty",
        description:
          "Nhân viên đăng nhập bằng email công ty và chỉ thấy phần việc của phòng mình.",
        typeKey: "FEATURE",
        statusKey: "TESTING",
        priority: ProjectPriority.HIGH,
        startOffset: -30,
        dueOffset: -2,
        estimate: 480,
        phase: 1,
        reporter: IT,
        assignees: [DUY, HUNG],
        reviewer: QUYNH,
        children: [
          {
            title: "Kiểm tra mật khẩu và phiên đăng nhập",
            description:
              "Khóa tài khoản sau nhiều lần nhập sai và giữ phiên làm việc trong ngày.",
            typeKey: "FEATURE",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.HIGH,
            startOffset: -16,
            dueOffset: 0,
            estimate: 240,
            assignees: [DUY],
            reviewer: QUYNH,
          },
          {
            title: "Phân quyền theo phòng ban",
            description:
              "Nhân viên chỉ sửa đơn của mình, trưởng phòng duyệt đơn của phòng.",
            typeKey: "FEATURE",
            statusKey: "CODE_REVIEW",
            priority: ProjectPriority.HIGH,
            startOffset: -14,
            dueOffset: 3,
            estimate: 180,
            assignees: [MAI],
            reviewer: HUNG,
          },
        ],
      },
      {
        title: "Màn hình gửi đơn nghỉ phép",
        description:
          "Nhân viên chọn ngày nghỉ, ghi lý do và theo dõi đơn đang chờ duyệt.",
        typeKey: "FEATURE",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.HIGH,
        startOffset: -14,
        dueOffset: 6,
        estimate: 360,
        phase: 1,
        reporter: IT,
        assignees: [THAO],
        reviewer: QUYNH,
        children: [
          {
            title: "Form chọn ngày và người duyệt",
            description:
              "Không cho gửi đơn khi chưa chọn người duyệt hoặc ngày kết thúc sớm hơn ngày bắt đầu.",
            typeKey: "FEATURE",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.HIGH,
            startOffset: -10,
            dueOffset: 2,
            estimate: 180,
            assignees: [THAO],
          },
          {
            title: "Danh sách đơn của tôi",
            description:
              "Hiện đơn đang chờ, đã duyệt và bị từ chối, kèm lý do từ chối.",
            typeKey: "FEATURE",
            statusKey: "TODO",
            priority: ProjectPriority.MEDIUM,
            startOffset: -2,
            dueOffset: 8,
            estimate: 120,
            assignees: [MAI],
          },
        ],
      },
      {
        title: "Bảng tin thông báo nội bộ",
        description:
          "Phòng Nhân sự đăng thông báo, ghim tin quan trọng và hẹn giờ hiện tin.",
        typeKey: "IMPROVEMENT",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.MEDIUM,
        startOffset: -7,
        dueOffset: 12,
        estimate: 240,
        phase: 1,
        reporter: IT,
        assignees: [THAO],
        reviewer: MAI,
        children: [
          {
            title: "Đăng tin và ghim thông báo",
            description:
              "Tin được ghim nằm trên cùng, tin thường xếp theo ngày đăng.",
            typeKey: "IMPROVEMENT",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.MEDIUM,
            startOffset: -5,
            dueOffset: 5,
            estimate: 150,
            assignees: [THAO],
          },
        ],
      },
      {
        title: "Tra cứu chính sách nhân sự",
        description:
          "Đưa nội quy, quy định nghỉ phép và phụ cấp lên mục tra cứu, có ô tìm kiếm.",
        typeKey: "FEATURE",
        statusKey: "TODO",
        priority: ProjectPriority.MEDIUM,
        startOffset: 3,
        dueOffset: 18,
        estimate: 240,
        phase: 1,
        reporter: IT,
        assignees: [MAI],
      },
      {
        title: "Gửi thư khi đơn được duyệt",
        description:
          "Khi trưởng phòng duyệt hoặc từ chối, nhân viên nhận thư kèm trạng thái đơn.",
        typeKey: "IMPROVEMENT",
        statusKey: "TODO",
        priority: ProjectPriority.LOW,
        startOffset: 8,
        dueOffset: 20,
        estimate: 180,
        phase: 1,
        reporter: IT,
        assignees: [DUY],
      },
      {
        title: "Số ngày phép còn lại hiển thị sai",
        description:
          "Nhân viên đã nghỉ 2 ngày nhưng màn hình vẫn hiện đủ 12 ngày phép năm.",
        typeKey: "HOTFIX",
        statusKey: "VERIFIED",
        priority: ProjectPriority.HIGH,
        startOffset: -8,
        dueOffset: -1,
        estimate: 180,
        phase: 1,
        reporter: QUYNH,
        assignees: [MAI],
        reviewer: QUYNH,
      },
      {
        title: "Thư xác nhận đơn không gửi đi",
        description:
          "Nhân viên gửi đơn thử lúc sáng nhưng không nhận được thư xác nhận trong hộp thư.",
        typeKey: "HOTFIX",
        statusKey: "FIXING",
        priority: ProjectPriority.URGENT,
        startOffset: -1,
        dueOffset: 1,
        estimate: 120,
        phase: 1,
        reporter: QUYNH,
        assignees: [DUY],
        reviewer: IT,
      },
      {
        title: "Kịch bản kiểm thử nghiệm thu",
        description:
          "Soạn các tình huống đăng nhập, gửi đơn, duyệt đơn và xem thông báo để nghiệm thu.",
        typeKey: "FEATURE",
        statusKey: "TODO",
        priority: ProjectPriority.MEDIUM,
        startOffset: 20,
        dueOffset: 40,
        estimate: 300,
        phase: 2,
        reporter: IT,
        assignees: [QUYNH],
      },
      {
        title: "Tài liệu hướng dẫn cho nhân viên",
        description:
          "Viết hướng dẫn ngắn: cách đăng nhập, gửi đơn nghỉ và tìm chính sách.",
        typeKey: "IMPROVEMENT",
        statusKey: "TODO",
        priority: ProjectPriority.LOW,
        startOffset: 28,
        dueOffset: 50,
        estimate: 180,
        phase: 2,
        reporter: IT,
        assignees: [MAI],
      },
    ],
  },
  {
    templateKey: "SCRUM",
    name: "Ứng dụng chấm công",
    description:
      "Làm ứng dụng điện thoại để nhân viên chấm công, gửi đơn nghỉ và để trưởng phòng theo dõi giờ làm.",
    visibility: ProjectVisibility.PRIVATE,
    priority: ProjectPriority.HIGH,
    status: ProjectStatus.IN_PROGRESS,
    startOffset: -51,
    endOffset: 37,
    createdByEmail: IT,
    members: [
      { email: HR, roleKey: "PRODUCT_OWNER" },
      { email: IT, roleKey: "SCRUM_MASTER" },
      { email: MAI, roleKey: "DEVELOPER" },
      { email: DUY, roleKey: "DEVELOPER" },
      { email: THAO, roleKey: "DEVELOPER" },
      { email: HUNG, roleKey: "DEVELOPER" },
      { email: QUYNH, roleKey: "DEVELOPER" },
    ],
    phases: [
      {
        name: "Sprint 1 — Tài khoản và hồ sơ",
        goal: "Nhân viên đăng nhập được và xem đúng phòng ban của mình.",
        startOffset: -51,
        endOffset: -26,
        status: ProjectPhaseStatus.COMPLETED,
      },
      {
        name: "Sprint 2 — Chấm công hằng ngày",
        goal: "Chấm công vào ca, tan ca và gửi đơn nghỉ ngay trên điện thoại.",
        startOffset: -23,
        endOffset: 2,
        status: ProjectPhaseStatus.ACTIVE,
      },
      {
        name: "Sprint 3 — Báo cáo cho quản lý",
        goal: "Trưởng phòng xem giờ làm của phòng và xuất file cho phòng Nhân sự.",
        startOffset: 5,
        endOffset: 30,
        status: ProjectPhaseStatus.PLANNED,
      },
    ],
    milestones: [
      {
        name: "Xong đăng nhập và hồ sơ",
        description: "Nhân viên phòng Công nghệ đã đăng nhập và xem hồ sơ trên máy thật.",
        dueOffset: -26,
        status: ProjectMilestoneStatus.REACHED,
        phase: 0,
        taskTitles: [
          "Đăng nhập và giữ phiên trên điện thoại",
          "Hồ sơ nhân viên trên ứng dụng",
        ],
      },
      {
        name: "Chấm công được trên điện thoại",
        description:
          "Nhân viên chấm vào ca và tan ca, đơn nghỉ gửi được từ ứng dụng.",
        dueOffset: 2,
        status: ProjectMilestoneStatus.OPEN,
        phase: 1,
        taskTitles: [
          "Chấm công vào ra bằng định vị",
          "Gửi đơn nghỉ trên ứng dụng",
        ],
      },
      {
        name: "Trưởng phòng xem được báo cáo công",
        description:
          "Báo cáo giờ làm trong tháng xuất được file để phòng Nhân sự đối chiếu.",
        dueOffset: 30,
        status: ProjectMilestoneStatus.OPEN,
        phase: 2,
        taskTitles: ["Màn hình báo cáo công tháng"],
      },
    ],
    tasks: [
      {
        title: "Đăng nhập và giữ phiên trên điện thoại",
        description:
          "Nhân viên đăng nhập bằng email công ty và không phải nhập lại khi mở ứng dụng trong ngày.",
        typeKey: "STORY",
        statusKey: "DONE",
        priority: ProjectPriority.HIGH,
        startOffset: -50,
        dueOffset: -30,
        estimate: 480,
        phase: 0,
        reporter: HR,
        assignees: [MAI, HUNG],
        reviewer: IT,
        children: [
          {
            title: "Màn hình đăng nhập",
            description:
              "Ô email, mật khẩu và thông báo khi tài khoản bị khóa.",
            typeKey: "TASK",
            statusKey: "DONE",
            priority: ProjectPriority.HIGH,
            startOffset: -50,
            dueOffset: -40,
            estimate: 180,
            assignees: [MAI],
          },
          {
            title: "Lưu phiên làm việc",
            description:
              "Mở lại ứng dụng trong ngày thì vào thẳng trang chủ, hết ngày thì yêu cầu đăng nhập.",
            typeKey: "TASK",
            statusKey: "DONE",
            priority: ProjectPriority.MEDIUM,
            startOffset: -40,
            dueOffset: -30,
            estimate: 150,
            assignees: [HUNG],
          },
        ],
      },
      {
        title: "Hồ sơ nhân viên trên ứng dụng",
        description:
          "Hiện họ tên, phòng ban, chức danh và ảnh để nhân viên kiểm tra đúng người.",
        typeKey: "STORY",
        statusKey: "DONE",
        priority: ProjectPriority.MEDIUM,
        startOffset: -38,
        dueOffset: -27,
        estimate: 240,
        phase: 0,
        reporter: HR,
        assignees: [THAO],
        reviewer: IT,
        children: [
          {
            title: "Hiển thị phòng ban và chức danh",
            description:
              "Lấy đúng phòng và chức danh đang khai báo trên hệ thống nhân sự.",
            typeKey: "TASK",
            statusKey: "DONE",
            priority: ProjectPriority.MEDIUM,
            startOffset: -38,
            dueOffset: -27,
            estimate: 120,
            assignees: [THAO],
          },
        ],
      },
      {
        title: "Chấm công vào ra bằng định vị",
        description:
          "Ghi giờ vào ca, giờ tan ca và cảnh báo khi nhân viên đứng ngoài văn phòng.",
        typeKey: "STORY",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.HIGH,
        startOffset: -20,
        dueOffset: 2,
        estimate: 480,
        phase: 1,
        reporter: HR,
        assignees: [DUY, HUNG],
        reviewer: QUYNH,
        children: [
          {
            title: "Ghi nhận giờ vào ca",
            description:
              "Bấm một lần để lưu giờ vào, không cho bấm lại trong cùng buổi sáng.",
            typeKey: "TASK",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.HIGH,
            startOffset: -16,
            dueOffset: 1,
            estimate: 180,
            assignees: [DUY],
          },
          {
            title: "Ghi nhận giờ tan ca",
            description:
              "Chỉ cho tan ca sau khi đã có giờ vào, và hiện tổng giờ trong ngày.",
            typeKey: "TASK",
            statusKey: "TODO",
            priority: ProjectPriority.HIGH,
            startOffset: -8,
            dueOffset: 2,
            estimate: 150,
            assignees: [HUNG],
          },
          {
            title: "Cảnh báo khi chấm ngoài văn phòng",
            description:
              "Nếu vị trí cách văn phòng quá 200 mét thì hỏi nhân viên xác nhận trước khi lưu.",
            typeKey: "TASK",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.MEDIUM,
            startOffset: -6,
            dueOffset: 0,
            estimate: 180,
            assignees: [MAI],
            reviewer: QUYNH,
          },
        ],
      },
      {
        title: "Gửi đơn nghỉ trên ứng dụng",
        description:
          "Nhân viên gửi đơn nghỉ từ điện thoại và thấy trạng thái duyệt ngay trên đơn.",
        typeKey: "STORY",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.MEDIUM,
        startOffset: -12,
        dueOffset: 4,
        estimate: 240,
        phase: 1,
        reporter: HR,
        assignees: [THAO],
        reviewer: QUYNH,
        children: [
          {
            title: "Form đơn nghỉ trên điện thoại",
            description:
              "Chọn loại nghỉ, ngày và lý do trên màn hình nhỏ, không bị che bàn phím.",
            typeKey: "TASK",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.MEDIUM,
            startOffset: -10,
            dueOffset: 3,
            estimate: 180,
            assignees: [THAO],
          },
        ],
      },
      {
        title: "Một lần chấm công bị tính hai lượt",
        description:
          "Bấm chấm công lúc mạng chậm thì bảng công ghi hai dòng cùng một giờ.",
        typeKey: "BUG",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.URGENT,
        startOffset: -3,
        dueOffset: -1,
        estimate: 120,
        phase: 1,
        reporter: QUYNH,
        assignees: [DUY],
        reviewer: IT,
      },
      {
        title: "Ứng dụng không mở trên Android 13",
        description:
          "Máy Android 13 của phòng Kho mở ứng dụng rồi thoát ngay ở màn hình chào.",
        typeKey: "BUG",
        statusKey: "TODO",
        priority: ProjectPriority.HIGH,
        startOffset: -1,
        dueOffset: 3,
        estimate: 180,
        phase: 1,
        reporter: QUYNH,
        assignees: [HUNG],
      },
      {
        title: "Màn hình báo cáo công tháng",
        description:
          "Trưởng phòng xem tổng giờ, ngày nghỉ và ngày đi muộn của từng người trong phòng.",
        typeKey: "STORY",
        statusKey: "TODO",
        priority: ProjectPriority.MEDIUM,
        startOffset: 6,
        dueOffset: 24,
        estimate: 360,
        phase: 2,
        reporter: HR,
        assignees: [MAI],
        reviewer: IT,
        children: [
          {
            title: "Bảng tổng giờ làm",
            description:
              "Mỗi dòng là một nhân viên, có giờ làm, giờ thiếu và số ngày nghỉ.",
            typeKey: "TASK",
            statusKey: "TODO",
            priority: ProjectPriority.MEDIUM,
            startOffset: 6,
            dueOffset: 16,
            estimate: 180,
            assignees: [MAI],
          },
          {
            title: "Xuất file cho phòng Nhân sự",
            description:
              "Xuất bảng công tháng theo mẫu phòng Nhân sự đang dùng để đối chiếu lương.",
            typeKey: "TASK",
            statusKey: "TODO",
            priority: ProjectPriority.MEDIUM,
            startOffset: 14,
            dueOffset: 24,
            estimate: 150,
            assignees: [DUY],
          },
        ],
      },
      {
        title: "Nhắc chấm công cuối ngày",
        description:
          "Nếu đến 17:30 chưa tan ca, ứng dụng gửi nhắc để nhân viên không quên.",
        typeKey: "STORY",
        statusKey: "TODO",
        priority: ProjectPriority.LOW,
        startOffset: 10,
        dueOffset: 28,
        estimate: 120,
        phase: 2,
        reporter: HR,
        assignees: [THAO],
      },
    ],
  },
  {
    templateKey: "KANBAN",
    name: "Chiến dịch tuyển dụng cuối năm",
    description:
      "Tuyển lập trình viên và thiết kế cho quý cuối năm, từ bài đăng, hình ảnh đến sàng lọc hồ sơ.",
    visibility: ProjectVisibility.PUBLIC,
    priority: ProjectPriority.MEDIUM,
    status: ProjectStatus.IN_PROGRESS,
    startOffset: -37,
    endOffset: 70,
    createdByEmail: MKT,
    members: [
      { email: MKT, roleKey: "TEAM_MEMBER" },
      { email: HR, roleKey: "TEAM_MEMBER" },
      { email: HA, roleKey: "TEAM_MEMBER" },
      { email: BACH, roleKey: "TEAM_MEMBER" },
      { email: LINH, roleKey: "TEAM_MEMBER" },
      { email: TAM, roleKey: "TEAM_MEMBER" },
    ],
    phases: [
      {
        name: "Chuẩn bị thông điệp",
        goal: "Có bài đăng và bộ ảnh được phòng Nhân sự cùng phòng Marketing duyệt.",
        startOffset: -37,
        endOffset: -18,
        status: ProjectPhaseStatus.COMPLETED,
      },
      {
        name: "Đăng tuyển trên các kênh",
        goal: "Đưa tin lên trang việc làm và mạng xã hội, theo dõi số người quan tâm.",
        startOffset: -16,
        endOffset: 28,
        status: ProjectPhaseStatus.ACTIVE,
      },
      {
        name: "Sàng lọc hồ sơ",
        goal: "Lọc hồ sơ phù hợp và chốt danh sách mời phỏng vấn vòng một.",
        startOffset: 29,
        endOffset: 70,
        status: ProjectPhaseStatus.PLANNED,
      },
    ],
    milestones: [
      {
        name: "Bộ bài đăng được duyệt",
        description: "Nội dung và hình ảnh tuyển dụng đã được duyệt để đăng ra ngoài.",
        dueOffset: -18,
        status: ProjectMilestoneStatus.REACHED,
        phase: 0,
        taskTitles: [
          "Thông điệp tuyển lập trình viên",
          "Bộ ảnh và banner tuyển dụng",
        ],
      },
      {
        name: "Đủ 40 hồ sơ phù hợp",
        description:
          "Mỗi vị trí có đủ hồ sơ đạt yêu cầu tối thiểu để phòng Nhân sự bắt đầu gọi.",
        dueOffset: -2,
        status: ProjectMilestoneStatus.OPEN,
        phase: 1,
        taskTitles: [
          "Đăng tin trên trang việc làm",
          "Lịch đăng mạng xã hội",
          "Theo dõi hồ sơ chưa phản hồi",
        ],
      },
      {
        name: "Chốt danh sách phỏng vấn",
        description: "Có lịch phỏng vấn vòng một cho các ứng viên được chọn.",
        dueOffset: 48,
        status: ProjectMilestoneStatus.OPEN,
        phase: 2,
        taskTitles: ["Kịch bản phỏng vấn vòng một"],
      },
    ],
    tasks: [
      {
        title: "Thông điệp tuyển lập trình viên",
        description:
          "Viết bài tuyển backend và frontend, nêu việc chính, mức kinh nghiệm và phúc lợi.",
        typeKey: "STORY",
        statusKey: "DONE",
        priority: ProjectPriority.HIGH,
        startOffset: -36,
        dueOffset: -22,
        estimate: 360,
        phase: 0,
        reporter: MKT,
        assignees: [BACH],
        reviewer: HR,
        children: [
          {
            title: "Bài tuyển lập trình viên backend",
            description:
              "Nhấn mạnh Node.js, làm việc với phòng sản phẩm và thời gian nhận việc trong quý 4.",
            typeKey: "TASK",
            statusKey: "DONE",
            priority: ProjectPriority.HIGH,
            startOffset: -36,
            dueOffset: -28,
            estimate: 150,
            assignees: [BACH],
          },
          {
            title: "Bài tuyển lập trình viên frontend",
            description:
              "Mô tả công việc làm giao diện React và phối hợp với thiết kế.",
            typeKey: "TASK",
            statusKey: "DONE",
            priority: ProjectPriority.HIGH,
            startOffset: -30,
            dueOffset: -22,
            estimate: 150,
            assignees: [BACH],
          },
        ],
      },
      {
        title: "Bộ ảnh và banner tuyển dụng",
        description:
          "Làm banner cho trang việc làm và ảnh vuông cho bài đăng mạng xã hội.",
        typeKey: "STORY",
        statusKey: "DONE",
        priority: ProjectPriority.MEDIUM,
        startOffset: -30,
        dueOffset: -19,
        estimate: 240,
        phase: 0,
        reporter: MKT,
        assignees: [TAM],
        reviewer: LINH,
      },
      {
        title: "Đăng tin trên trang việc làm",
        description:
          "Đưa ba vị trí lên trang tuyển dụng của công ty và cập nhật hạn nộp hồ sơ.",
        typeKey: "STORY",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.HIGH,
        startOffset: -14,
        dueOffset: 4,
        estimate: 240,
        phase: 1,
        reporter: HR,
        assignees: [LINH, HA],
        reviewer: MKT,
        children: [
          {
            title: "Cập nhật trang việc làm",
            description:
              "Sửa hạn nộp, mức lương hiển thị và nút nộp hồ sơ cho từng vị trí.",
            typeKey: "TASK",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.HIGH,
            startOffset: -8,
            dueOffset: 0,
            estimate: 120,
            assignees: [LINH],
          },
        ],
      },
      {
        title: "Lịch đăng mạng xã hội",
        description:
          "Xếp lịch bài trong hai tuần, xen kẽ giới thiệu việc và chân dung người trong công ty.",
        typeKey: "STORY",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.MEDIUM,
        startOffset: -10,
        dueOffset: 7,
        estimate: 180,
        phase: 1,
        reporter: MKT,
        assignees: [LINH],
        children: [
          {
            title: "Bài Facebook tuần này",
            description:
              "Đăng bài tuyển frontend kèm ảnh văn phòng, trả lời bình luận trong ngày.",
            typeKey: "TASK",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.MEDIUM,
            startOffset: -2,
            dueOffset: 1,
            estimate: 90,
            assignees: [LINH],
          },
        ],
      },
      {
        title: "Bài chân dung nhân viên",
        description:
          "Phỏng vấn một lập trình viên và một bạn thiết kế để kể một ngày làm việc.",
        typeKey: "STORY",
        statusKey: "SELECTED",
        priority: ProjectPriority.MEDIUM,
        startOffset: 1,
        dueOffset: 14,
        estimate: 240,
        phase: 1,
        reporter: MKT,
        assignees: [BACH, TAM],
      },
      {
        title: "Theo dõi hồ sơ chưa phản hồi",
        description:
          "Những hồ sơ đủ yêu cầu mà quá hai ngày chưa được gọi thì chuyển cho phòng Nhân sự.",
        typeKey: "TASK",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.HIGH,
        startOffset: -6,
        dueOffset: -1,
        estimate: 120,
        phase: 1,
        reporter: HR,
        assignees: [HA],
        reviewer: MKT,
      },
      {
        title: "Phối hợp sàng lọc với phòng Nhân sự",
        description:
          "Mỗi thứ Sáu ngồi lại để loại hồ sơ không đạt và giữ danh sách cần gọi tuần sau.",
        typeKey: "STORY",
        statusKey: "SELECTED",
        priority: ProjectPriority.MEDIUM,
        startOffset: 4,
        dueOffset: 18,
        estimate: 150,
        phase: 1,
        reporter: HR,
        assignees: [HA, BACH],
      },
      {
        title: "Kịch bản phỏng vấn vòng một",
        description:
          "Soạn câu hỏi chuyên môn 30 phút và phần giới thiệu đội cho ứng viên.",
        typeKey: "STORY",
        statusKey: "BACKLOG",
        priority: ProjectPriority.MEDIUM,
        startOffset: 22,
        dueOffset: 40,
        estimate: 180,
        phase: 2,
        reporter: HR,
        assignees: [HA],
      },
      {
        title: "Báo cáo chi phí chiến dịch",
        description:
          "Tổng hợp tiền đăng tin, thiết kế và số hồ sơ có được trên từng kênh.",
        typeKey: "TASK",
        statusKey: "BACKLOG",
        priority: ProjectPriority.LOW,
        startOffset: 30,
        dueOffset: 60,
        estimate: 120,
        phase: 2,
        reporter: MKT,
        assignees: [BACH],
      },
    ],
  },
  {
    templateKey: "BUG_TRACKING",
    name: "Đối soát bảng lương tháng 10",
    description:
      "Xử lý các lệch số của kỳ lương tháng 10 và chốt bảng lương trước hạn thanh toán.",
    visibility: ProjectVisibility.PRIVATE,
    priority: ProjectPriority.URGENT,
    status: ProjectStatus.IN_PROGRESS,
    isUrgent: true,
    startOffset: -21,
    endOffset: 24,
    createdByEmail: BAO,
    members: [
      { email: BAO, roleKey: "REPORTER" },
      { email: IT, roleKey: "REPORTER" },
      { email: DUY, roleKey: "DEVELOPER" },
      { email: HUNG, roleKey: "DEVELOPER" },
      { email: QUYNH, roleKey: "QA" },
    ],
    phases: [
      {
        name: "Xử lý kỳ lương tháng 10",
        goal: "Sửa các lệch số đang chặn việc chốt bảng lương tháng này.",
        startOffset: -21,
        endOffset: 3,
        status: ProjectPhaseStatus.ACTIVE,
      },
      {
        name: "Phòng ngừa kỳ tháng 11",
        goal: "Ghi lại cách đối soát để kỳ lương sau không lặp lại các lệch này.",
        startOffset: 6,
        endOffset: 24,
        status: ProjectPhaseStatus.PLANNED,
      },
    ],
    milestones: [
      {
        name: "Chốt bảng lương tháng 10",
        description:
          "Kế toán ký xác nhận bảng lương sau khi các lệch số trong kỳ đã được xử lý.",
        dueOffset: 3,
        status: ProjectMilestoneStatus.OPEN,
        phase: 0,
        taskTitles: [
          "Phụ cấp ăn ca bị tính thiếu",
          "Sai thuế thu nhập của nhân viên thử việc",
          "Lệch ngày công với máy chấm",
          "Không xuất được file gửi ngân hàng",
        ],
      },
      {
        name: "Đối soát thử tháng 11",
        description:
          "Chạy thử một vòng đối soát với dữ liệu đầu tháng 11 trước khi vào kỳ chính.",
        dueOffset: 24,
        status: ProjectMilestoneStatus.OPEN,
        phase: 1,
        taskTitles: ["Nhật ký đối soát mỗi kỳ lương"],
      },
    ],
    tasks: [
      {
        title: "Phụ cấp ăn ca bị tính thiếu",
        description:
          "Nhân viên đi làm đủ ngày nhưng phụ cấp ăn ca trên bảng lương thiếu hai ngày.",
        typeKey: "INCIDENT",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.URGENT,
        startOffset: -6,
        dueOffset: 0,
        estimate: 240,
        phase: 0,
        reporter: BAO,
        assignees: [DUY],
        reviewer: QUYNH,
        children: [
          {
            title: "Đối chiếu file chấm công",
            description:
              "So từng ngày giữa file máy chấm và dòng phụ cấp trên bảng lương.",
            typeKey: "BUG",
            statusKey: "IN_PROGRESS",
            priority: ProjectPriority.URGENT,
            startOffset: -4,
            dueOffset: 0,
            estimate: 150,
            assignees: [DUY],
            reviewer: QUYNH,
          },
        ],
      },
      {
        title: "Sai thuế thu nhập của nhân viên thử việc",
        description:
          "Ba nhân viên thử việc bị tính thuế như nhân viên chính thức trong kỳ này.",
        typeKey: "BUG",
        statusKey: "RESOLVED",
        priority: ProjectPriority.HIGH,
        startOffset: -12,
        dueOffset: -2,
        estimate: 180,
        phase: 0,
        reporter: BAO,
        assignees: [HUNG],
        reviewer: QUYNH,
      },
      {
        title: "Lệch ngày công với máy chấm",
        description:
          "Phòng Marketing thiếu hai ngày công so với máy chấm sau khi lỗi đã được đóng một lần.",
        typeKey: "BUG",
        statusKey: "REOPENED",
        priority: ProjectPriority.HIGH,
        startOffset: -10,
        dueOffset: 1,
        estimate: 180,
        phase: 0,
        reporter: BAO,
        assignees: [DUY],
        reviewer: QUYNH,
      },
      {
        title: "Không xuất được file gửi ngân hàng",
        description:
          "Bấm xuất file lương thì trang báo lỗi, kế toán chưa gửi được danh sách chi.",
        typeKey: "BUG",
        statusKey: "IN_PROGRESS",
        priority: ProjectPriority.URGENT,
        startOffset: -2,
        dueOffset: 1,
        estimate: 150,
        phase: 0,
        reporter: IT,
        assignees: [HUNG],
        reviewer: QUYNH,
      },
      {
        title: "Công thức thưởng dự án tháng 9",
        description:
          "Thưởng dự án đã cộng sai hệ số. Kỳ tháng 9 đã tính lại và đối chiếu khớp.",
        typeKey: "BUG",
        statusKey: "CLOSED",
        priority: ProjectPriority.MEDIUM,
        startOffset: -18,
        dueOffset: -8,
        estimate: 180,
        phase: 0,
        reporter: BAO,
        assignees: [DUY],
        reviewer: QUYNH,
      },
      {
        title: "Làm tròn số tiền lẻ",
        description:
          "Một số dòng lương lẻ 500 đồng, cần thống nhất cách làm tròn trước kỳ tới.",
        typeKey: "BUG",
        statusKey: "OPEN",
        priority: ProjectPriority.MEDIUM,
        startOffset: 2,
        dueOffset: 8,
        estimate: 90,
        phase: 1,
        reporter: BAO,
        assignees: [HUNG],
      },
      {
        title: "Nhật ký đối soát mỗi kỳ lương",
        description:
          "Ghi các bước kế toán và kỹ thuật cùng kiểm trước khi chốt, để kỳ sau làm lại được.",
        typeKey: "INCIDENT",
        statusKey: "OPEN",
        priority: ProjectPriority.LOW,
        startOffset: 8,
        dueOffset: 20,
        estimate: 120,
        phase: 1,
        reporter: IT,
        assignees: [QUYNH, BAO],
      },
    ],
  },
];

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftKey(key: string, offset: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  const monthText = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayText = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${monthText}-${dayText}`;
}

function dateOnly(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

function atHour(key: string, hour: number) {
  const hourText = String(hour).padStart(2, "0");
  return new Date(`${key}T${hourText}:00:00.000+07:00`);
}

function paragraph(text: string) {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${safe}</p>`;
}

function assertClean(value: string, label: string) {
  if (value.toLowerCase().includes("seed")) {
    throw new Error(`Nội dung không hợp lệ ở ${label}`);
  }
}

function collectTexts(plan: ProjectPlan) {
  const texts: { label: string; value: string }[] = [
    { label: plan.name, value: plan.name },
    { label: plan.name, value: plan.description },
  ];
  for (const phase of plan.phases) {
    texts.push({ label: phase.name, value: phase.name });
    texts.push({ label: phase.name, value: phase.goal });
  }
  for (const milestone of plan.milestones) {
    texts.push({ label: milestone.name, value: milestone.name });
    texts.push({ label: milestone.name, value: milestone.description });
  }
  const visit = (item: ChildWork) => {
    texts.push({ label: item.title, value: item.title });
    texts.push({ label: item.title, value: item.description });
  };
  for (const task of plan.tasks) {
    visit(task);
    for (const child of task.children ?? []) visit(child);
  }
  return texts;
}

async function loadUsers(prisma: PrismaClient, plans: ProjectPlan[]) {
  const emails = [
    ...new Set(
      plans.flatMap((plan) => [
        plan.createdByEmail,
        ...plan.members.map((member) => member.email),
        ...plan.tasks.flatMap((task) => [
          task.reporter,
          ...task.assignees,
          task.reviewer,
          ...(task.children ?? []).flatMap((child) => [
            ...child.assignees,
            child.reviewer,
          ]),
        ]),
      ]),
    ),
  ].filter((email): email is string => Boolean(email));

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const byEmail = new Map(users.map((user) => [user.email, user.id]));
  const missing = emails.filter((email) => !byEmail.has(email));
  if (missing.length > 0) {
    throw new Error(`Thiếu người dùng: ${missing.join(", ")}`);
  }
  return byEmail;
}

async function createProject(
  prisma: PrismaClient,
  plan: ProjectPlan,
  users: Map<string, number>,
  today: string,
) {
  const template = await prisma.projectTemplate.findUnique({
    where: { key: plan.templateKey },
    include: {
      projectRoles: true,
      taskTypes: true,
      workflows: {
        include: {
          statuses: true,
          transitions: { include: { approvalRules: true } },
        },
      },
    },
  });
  if (!template) {
    throw new Error(`Không tìm thấy mẫu ${plan.templateKey}`);
  }

  const creatorId = users.get(plan.createdByEmail);
  if (!creatorId) {
    throw new Error(`Không tìm thấy người tạo ${plan.name}`);
  }
  if (!plan.members.some((member) => member.email === plan.createdByEmail)) {
    throw new Error(`${plan.name} thiếu người tạo trong danh sách thành viên`);
  }

  const titles = new Set<string>();
  for (const task of plan.tasks) {
    if (titles.has(task.title)) {
      throw new Error(`Trùng tên công việc: ${task.title}`);
    }
    titles.add(task.title);
    for (const child of task.children ?? []) {
      if (titles.has(child.title)) {
        throw new Error(`Trùng tên công việc: ${child.title}`);
      }
      titles.add(child.title);
    }
  }

  return prisma.$transaction(
    async (tx) => {
      const startKey = shiftKey(today, plan.startOffset);
      const project = await tx.project.create({
        data: {
          name: plan.name,
          description: plan.description,
          visibility: plan.visibility,
          priority: plan.priority,
          status: plan.status,
          isUrgent: plan.isUrgent ?? false,
          startDate: dateOnly(startKey),
          endDate: dateOnly(shiftKey(today, plan.endOffset)),
          templateId: template.id,
          templateVersion: template.version,
          createdById: creatorId,
          updatedById: creatorId,
        },
      });

      const roleIdByTemplateId = new Map<number, number>();
      const roleIdByKey = new Map<string, number>();
      for (const role of template.projectRoles) {
        const created = await tx.projectRole.create({
          data: {
            projectId: project.id,
            key: role.key,
            name: role.name,
            description: role.description,
            sortOrder: role.sortOrder,
          },
        });
        roleIdByTemplateId.set(role.id, created.id);
        roleIdByKey.set(role.key, created.id);
      }

      let managerRoleId = roleIdByKey.get("PROJECT_MANAGER");
      if (!managerRoleId) {
        const usedNames = new Set(template.projectRoles.map((role) => role.name));
        let name = "Project Manager";
        let suffix = 2;
        while (usedNames.has(name)) {
          name = `Project Manager ${suffix}`;
          suffix += 1;
        }
        const created = await tx.projectRole.create({
          data: {
            projectId: project.id,
            key: "PROJECT_MANAGER",
            name,
            sortOrder: 0,
          },
        });
        managerRoleId = created.id;
        roleIdByKey.set("PROJECT_MANAGER", created.id);
      }

      const statusIdByTemplateId = new Map<number, number>();
      const workflowIdByTemplateId = new Map<number, number>();
      const workflowById = new Map<
        number,
        Map<string, { id: number; category: WorkflowStatusCategory }>
      >();
      let defaultWorkflowId = 0;

      for (const workflow of template.workflows) {
        const created = await tx.workflow.create({
          data: {
            projectId: project.id,
            name: workflow.name,
            description: workflow.description,
            isDefault: workflow.isDefault,
            isActive: workflow.isActive,
            transitionMode: workflow.transitionMode,
          },
        });
        workflowIdByTemplateId.set(workflow.id, created.id);
        if (workflow.isDefault || defaultWorkflowId === 0) {
          defaultWorkflowId = created.id;
        }

        const statuses = new Map<
          string,
          { id: number; category: WorkflowStatusCategory }
        >();
        for (const status of workflow.statuses) {
          const row = await tx.workflowStatus.create({
            data: {
              workflowId: created.id,
              name: status.name,
              key: status.key,
              description: status.description,
              sortOrder: status.sortOrder,
              category: status.category,
              color: status.color,
              isInitial: status.isInitial,
              isFinal: status.isFinal,
            },
          });
          statusIdByTemplateId.set(status.id, row.id);
          statuses.set(status.key, { id: row.id, category: status.category });
        }
        workflowById.set(created.id, statuses);

        for (const transition of workflow.transitions) {
          const fromStatusId = statusIdByTemplateId.get(transition.fromStatusId);
          const toStatusId = statusIdByTemplateId.get(transition.toStatusId);
          if (!fromStatusId || !toStatusId) {
            throw new Error(
              `${plan.name}: thiếu trạng thái của bước ${transition.name}`,
            );
          }
          const createdTransition = await tx.projectWorkflowTransition.create({
            data: {
              workflowId: created.id,
              fromStatusId,
              toStatusId,
              name: transition.name,
              isActive: transition.isActive,
            },
          });
          for (const rule of transition.approvalRules) {
            const onRejectStatusId = statusIdByTemplateId.get(
              rule.onRejectStatusId,
            );
            if (!onRejectStatusId) {
              throw new Error(
                `${plan.name}: thiếu trạng thái từ chối của ${transition.name}`,
              );
            }
            await tx.projectApprovalRule.create({
              data: {
                transitionId: createdTransition.id,
                approverType: rule.approverType,
                projectRoleId: rule.projectRoleId
                  ? (roleIdByTemplateId.get(rule.projectRoleId) ?? null)
                  : null,
                taskRole: rule.taskRole,
                minApprovals: rule.minApprovals,
                onRejectStatusId,
              },
            });
          }
        }
      }

      const typeByKey = new Map<string, { id: number; workflowId: number }>();
      for (const taskType of template.taskTypes) {
        const workflowId = taskType.workflowId
          ? workflowIdByTemplateId.get(taskType.workflowId)
          : defaultWorkflowId;
        if (!workflowId) {
          throw new Error(`${plan.name}: loại việc ${taskType.key} chưa có quy trình`);
        }
        const created = await tx.projectTaskType.create({
          data: {
            projectId: project.id,
            workflowId,
            name: taskType.name,
            key: taskType.key,
            description: taskType.description,
            sortOrder: taskType.sortOrder,
            isActive: taskType.isActive,
          },
        });
        typeByKey.set(taskType.key, { id: created.id, workflowId });
      }

      const roleIdByEmail = new Map<string, number>();
      for (const member of plan.members) {
        const userId = users.get(member.email);
        const roleId = roleIdByKey.get(member.roleKey);
        if (!userId || !roleId) {
          throw new Error(
            `${plan.name}: không gán được vai trò ${member.roleKey} cho ${member.email}`,
          );
        }
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId,
            projectRoleId: roleId,
            joinedAt: dateOnly(startKey),
          },
        });
        if (
          member.roleKey !== "PROJECT_MANAGER" ||
          !roleIdByEmail.has(member.email)
        ) {
          roleIdByEmail.set(member.email, roleId);
        }
      }

      const creatorIsManager = plan.members.some(
        (member) =>
          member.email === plan.createdByEmail &&
          member.roleKey === "PROJECT_MANAGER",
      );
      if (!creatorIsManager) {
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId: creatorId,
            projectRoleId: managerRoleId,
            joinedAt: dateOnly(startKey),
          },
        });
      }

      const phaseIds: number[] = [];
      for (const [index, phase] of plan.phases.entries()) {
        const created = await tx.projectPhase.create({
          data: {
            projectId: project.id,
            name: phase.name,
            goal: phase.goal,
            startDate: dateOnly(shiftKey(today, phase.startOffset)),
            endDate: dateOnly(shiftKey(today, phase.endOffset)),
            status: phase.status,
            sortOrder: index + 1,
            createdById: creatorId,
          },
        });
        phaseIds.push(created.id);
      }

      const taskIdByTitle = new Map<string, number>();
      let sequence = 0;
      const nextCode = () => {
        sequence += 1;
        return `T-${sequence}`;
      };

      const requireUser = (email: string) => {
        const userId = users.get(email);
        if (!userId || !roleIdByEmail.has(email)) {
          throw new Error(`${plan.name}: ${email} không ở trong dự án`);
        }
        return userId;
      };

      const insertTask = async (
        item: ChildWork,
        phaseId: number,
        parentTaskId: number | null,
        reporterEmail: string,
      ) => {
        const taskType = typeByKey.get(item.typeKey);
        if (!taskType) {
          throw new Error(`${plan.name}: không có loại việc ${item.typeKey}`);
        }
        const status = workflowById.get(taskType.workflowId)?.get(item.statusKey);
        if (!status) {
          throw new Error(
            `${plan.name}: ${item.title} không có trạng thái ${item.statusKey}`,
          );
        }

        const startKeyOfTask =
          item.startOffset == null ? null : shiftKey(today, item.startOffset);
        const dueKey =
          item.dueOffset == null ? null : shiftKey(today, item.dueOffset);
        const done = status.category === WorkflowStatusCategory.DONE;
        const reporterId = requireUser(reporterEmail);

        const created = await tx.task.create({
          data: {
            projectId: project.id,
            code: nextCode(),
            title: item.title,
            description: paragraph(item.description),
            workflowId: taskType.workflowId,
            taskTypeId: taskType.id,
            statusId: status.id,
            priority: item.priority,
            startDate: startKeyOfTask ? dateOnly(startKeyOfTask) : null,
            dueDate: dueKey ? dateOnly(dueKey) : null,
            estimatedMinutes: item.estimate,
            parentTaskId,
            phaseId,
            createdById: reporterId,
            completedAt: done
              ? atHour(dueKey ?? startKeyOfTask ?? today, 17)
              : null,
            createdAt: atHour(startKeyOfTask ?? today, 9),
            members: {
              create: [
                ...[...new Set(item.assignees)].map((email) => ({
                  userId: requireUser(email),
                  taskRole: TemplateTaskRole.ASSIGNEE,
                  projectRoleId: roleIdByEmail.get(email) ?? null,
                })),
                {
                  userId: reporterId,
                  taskRole: TemplateTaskRole.REPORTER,
                  projectRoleId: null,
                },
                ...(item.reviewer
                  ? [
                      {
                        userId: requireUser(item.reviewer),
                        taskRole: TemplateTaskRole.REVIEWER,
                        projectRoleId: null,
                      },
                    ]
                  : []),
              ],
            },
          },
          select: { id: true },
        });
        taskIdByTitle.set(item.title, created.id);
        return created.id;
      };

      for (const task of plan.tasks) {
        const phaseId = phaseIds[task.phase];
        if (!phaseId) {
          throw new Error(`${plan.name}: việc "${task.title}" chưa có giai đoạn`);
        }
        const parentId = await insertTask(task, phaseId, null, task.reporter);
        for (const child of task.children ?? []) {
          await insertTask(child, phaseId, parentId, task.reporter);
        }
      }

      for (const milestone of plan.milestones) {
        const phaseId = phaseIds[milestone.phase];
        if (!phaseId) {
          throw new Error(`${plan.name}: cột mốc "${milestone.name}" chưa có giai đoạn`);
        }
        const taskIds = milestone.taskTitles.map((title) => {
          const taskId = taskIdByTitle.get(title);
          if (!taskId) {
            throw new Error(
              `${plan.name}: cột mốc "${milestone.name}" không thấy việc "${title}"`,
            );
          }
          return taskId;
        });
        const dueKey = shiftKey(today, milestone.dueOffset);
        await tx.projectMilestone.create({
          data: {
            projectId: project.id,
            phaseId,
            name: milestone.name,
            description: milestone.description,
            dueDate: dateOnly(dueKey),
            status: milestone.status,
            reachedAt:
              milestone.status === ProjectMilestoneStatus.REACHED
                ? atHour(dueKey, 16)
                : null,
            createdById: creatorId,
            tasks: {
              create: taskIds.map((taskId) => ({ taskId })),
            },
          },
        });
      }

      await tx.project.update({
        where: { id: project.id },
        data: { nextTaskNumber: sequence },
      });
      return sequence;
    },
    { timeout: 120_000 },
  );
}

export async function seedProjects(prisma: PrismaClient) {
  console.log("--- Tạo dự án, giai đoạn, cột mốc và công việc ---");

  for (const plan of projects) {
    for (const text of collectTexts(plan)) {
      assertClean(text.value, text.label);
    }
  }

  const keys = [...new Set(projects.map((plan) => plan.templateKey))];
  const ready = await prisma.projectTemplate.count({
    where: { key: { in: keys } },
  });
  if (ready < keys.length) {
    await seedProjectTemplates(prisma);
  }

  await clearProjects(prisma);
  const users = await loadUsers(prisma, projects);
  const today = todayKey();

  for (const plan of projects) {
    const taskCount = await createProject(prisma, plan, users, today);
    console.log(
      `✅ ${plan.name}: ${plan.phases.length} giai đoạn, ${plan.milestones.length} cột mốc, ${taskCount} công việc.`,
    );
  }
}
