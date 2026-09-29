import {
  ApprovalApproverType,
  WorkflowStatusCategory,
} from "@prisma/client";
import type { ActivationError } from "@/modules/project-template/project-template.types";
import type { findTemplateDetailForActivation } from "@/modules/project-template/project-template.repository";

type ActivationTemplate = NonNullable<
  Awaited<ReturnType<typeof findTemplateDetailForActivation>>
>;

function validateStatusFlags(
  status: ActivationTemplate["workflows"][number]["statuses"][number],
  workflowName: string,
  errors: ActivationError[],
) {
  if (status.isInitial && status.isFinal) {
    errors.push({
      field: "status",
      message: `Trạng thái "${status.name}" trong workflow "${workflowName}" không thể vừa là bắt đầu vừa là kết thúc`,
    });
  }

  if (status.isInitial && status.category !== WorkflowStatusCategory.TODO) {
    errors.push({
      field: "status",
      message: `Trạng thái bắt đầu "${status.name}" trong workflow "${workflowName}" phải có category TODO`,
    });
  }

  if (
    status.isFinal &&
    status.category !== WorkflowStatusCategory.DONE &&
    status.category !== WorkflowStatusCategory.CANCELLED
  ) {
    errors.push({
      field: "status",
      message: `Trạng thái kết thúc "${status.name}" trong workflow "${workflowName}" phải có category DONE hoặc CANCELLED`,
    });
  }

  if (
    status.category === WorkflowStatusCategory.IN_PROGRESS &&
    (status.isInitial || status.isFinal)
  ) {
    errors.push({
      field: "status",
      message: `Trạng thái "${status.name}" category IN_PROGRESS trong workflow "${workflowName}" không được là bắt đầu hoặc kết thúc`,
    });
  }
}

function validateWorkflowReachability(
  workflow: ActivationTemplate["workflows"][number],
  errors: ActivationError[],
) {
  const initialStatuses = workflow.statuses.filter((s) => s.isInitial);

  if (initialStatuses.length !== 1) {
    return;
  }

  const initialId = initialStatuses[0]!.id;
  const activeTransitions = workflow.transitions.filter((t) => t.isActive);
  const reachable = new Set<number>([initialId]);
  const queue = [initialId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const transition of activeTransitions) {
      if (transition.fromStatusId === current && !reachable.has(transition.toStatusId)) {
        reachable.add(transition.toStatusId);
        queue.push(transition.toStatusId);
      }
    }
  }

  for (const status of workflow.statuses) {
    if (!reachable.has(status.id)) {
      errors.push({
        field: "status",
        message: status.isFinal
          ? `Trạng thái kết thúc "${status.name}" trong workflow "${workflow.name}" không thể đến được từ trạng thái bắt đầu`
          : `Trạng thái "${status.name}" trong workflow "${workflow.name}" không thể đến được từ trạng thái bắt đầu`,
      });
    }
  }
}

function validateApprovalRuleFields(
  rule: ActivationTemplate["workflows"][number]["transitions"][number]["approvalRules"][number],
  transition: ActivationTemplate["workflows"][number]["transitions"][number],
  workflow: ActivationTemplate["workflows"][number],
  template: ActivationTemplate,
  errors: ActivationError[],
) {
  if (rule.minApprovals < 1) {
    errors.push({
      field: "approval",
      message: `Quy tắc duyệt trên transition "${transition.name}" trong workflow "${workflow.name}" cần minApprovals >= 1`,
    });
  }

  if (rule.approverType === ApprovalApproverType.PROJECT_ROLE) {
    if (!rule.projectRoleId) {
      errors.push({
        field: "approval",
        message: `Quy tắc duyệt PROJECT_ROLE trên transition "${transition.name}" thiếu projectRoleId`,
      });
    } else {
      const role = template.projectRoles.find((r) => r.id === rule.projectRoleId);
      if (!role || role.templateId !== template.id) {
        errors.push({
          field: "approval",
          message: `Project role trong quy tắc duyệt transition "${transition.name}" không hợp lệ`,
        });
      }
    }

    if (rule.taskRole !== null) {
      errors.push({
        field: "approval",
        message: `Quy tắc duyệt PROJECT_ROLE trên transition "${transition.name}" không được có taskRole`,
      });
    }
  }

  if (rule.approverType === ApprovalApproverType.TASK_ROLE) {
    if (!rule.taskRole) {
      errors.push({
        field: "approval",
        message: `Quy tắc duyệt TASK_ROLE trên transition "${transition.name}" thiếu taskRole`,
      });
    }

    if (rule.projectRoleId !== null) {
      errors.push({
        field: "approval",
        message: `Quy tắc duyệt TASK_ROLE trên transition "${transition.name}" không được có projectRoleId`,
      });
    }
  }

  const rejectStatus = workflow.statuses.find(
    (s) => s.id === rule.onRejectStatusId,
  );

  if (!rejectStatus) {
    errors.push({
      field: "approval",
      message: `Trạng thái từ chối trong quy tắc duyệt transition "${transition.name}" không thuộc workflow "${workflow.name}"`,
    });
  } else if (rule.onRejectStatusId === transition.toStatusId) {
    errors.push({
      field: "approval",
      message: `Trạng thái từ chối không được trùng trạng thái đích của transition "${transition.name}"`,
    });
  }
}

export function validateTemplateForActivation(
  template: ActivationTemplate,
): ActivationError[] {
  const errors: ActivationError[] = [];

  const activeTaskTypes = template.taskTypes.filter((t) => t.isActive);
  if (activeTaskTypes.length === 0) {
    errors.push({
      field: "taskType",
      message: "Cần ít nhất một loại công việc đang hoạt động",
    });
  }

  if (template.projectRoles.length === 0) {
    errors.push({
      field: "projectRole",
      message: "Cần ít nhất một vai trò dự án",
    });
  }

  const activeWorkflows = template.workflows.filter((w) => w.isActive);
  if (activeWorkflows.length === 0) {
    errors.push({
      field: "workflow",
      message: "Cần ít nhất một workflow đang hoạt động",
    });
  }

  const defaultWorkflows = template.workflows.filter((w) => w.isDefault);
  if (defaultWorkflows.length !== 1) {
    errors.push({
      field: "workflow",
      message: "Phải có đúng một workflow mặc định",
    });
  } else if (!defaultWorkflows[0]!.isActive) {
    errors.push({
      field: "workflow",
      message: "Workflow mặc định phải đang hoạt động",
    });
  }

  const defaultWorkflow = defaultWorkflows[0];

  for (const taskType of activeTaskTypes) {
    if (taskType.workflowId !== null) {
      const workflow = template.workflows.find((w) => w.id === taskType.workflowId);
      if (!workflow || workflow.templateId !== template.id) {
        errors.push({
          field: "taskType",
          message: `Loại công việc "${taskType.name}" tham chiếu workflow không tồn tại`,
        });
      } else if (!workflow.isActive) {
        errors.push({
          field: "taskType",
          message: `Loại công việc "${taskType.name}" tham chiếu workflow không hoạt động`,
        });
      }
    } else if (!defaultWorkflow || !defaultWorkflow.isActive) {
      errors.push({
        field: "taskType",
        message: `Loại công việc "${taskType.name}" cần workflow mặc định đang hoạt động`,
      });
    }
  }

  for (const workflow of activeWorkflows) {
    const initialCount = workflow.statuses.filter((s) => s.isInitial).length;
    const finalCount = workflow.statuses.filter((s) => s.isFinal).length;

    if (initialCount !== 1) {
      errors.push({
        field: "status",
        message: `Workflow "${workflow.name}" phải có đúng một trạng thái bắt đầu`,
      });
    }

    if (finalCount < 1) {
      errors.push({
        field: "status",
        message: `Workflow "${workflow.name}" cần ít nhất một trạng thái kết thúc`,
      });
    }

    const statusKeys = new Set<string>();
    const statusNames = new Set<string>();
    for (const status of workflow.statuses) {
      if (statusKeys.has(status.key)) {
        errors.push({
          field: "status",
          message: `Key trạng thái "${status.key}" bị trùng trong workflow "${workflow.name}"`,
        });
      }
      statusKeys.add(status.key);

      if (statusNames.has(status.name)) {
        errors.push({
          field: "status",
          message: `Tên trạng thái "${status.name}" bị trùng trong workflow "${workflow.name}"`,
        });
      }
      statusNames.add(status.name);

      validateStatusFlags(status, workflow.name, errors);
    }

    validateWorkflowReachability(workflow, errors);

    for (const transition of workflow.transitions.filter((t) => t.isActive)) {
      for (const rule of transition.approvalRules) {
        validateApprovalRuleFields(rule, transition, workflow, template, errors);
      }
    }
  }

  return errors;
}
