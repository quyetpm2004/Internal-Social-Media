import { ApprovalApproverType, Prisma } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import * as repo from "@/modules/project-template/project-template.repository";
import type {
  CreateApprovalRuleInput,
  UpdateApprovalRuleInput,
} from "@/modules/project-template/project-template.schema";
import {
  ensureDraftTemplate,
  touchTemplate,
} from "@/modules/project-template/services/template.service";

type RuleFields = {
  approverType: ApprovalApproverType;
  projectRoleId: number | null;
  taskRole: CreateApprovalRuleInput["taskRole"] | null;
  minApprovals: number;
  onRejectStatusId: number;
};

function validateApprovalRuleFields(
  templateId: number,
  workflowId: number,
  toStatusId: number,
  fields: RuleFields,
) {
  if (fields.minApprovals < 1) {
    throw new AppError(400, "minApprovals phải >= 1");
  }

  if (fields.approverType === ApprovalApproverType.PROJECT_ROLE) {
    if (!fields.projectRoleId) {
      throw new AppError(400, "PROJECT_ROLE yêu cầu projectRoleId");
    }
    if (fields.taskRole != null) {
      throw new AppError(400, "PROJECT_ROLE không được có taskRole");
    }
  }

  if (fields.approverType === ApprovalApproverType.TASK_ROLE) {
    if (!fields.taskRole) {
      throw new AppError(400, "TASK_ROLE yêu cầu taskRole");
    }
    if (fields.projectRoleId != null) {
      throw new AppError(400, "TASK_ROLE không được có projectRoleId");
    }
  }

  if (fields.onRejectStatusId === toStatusId) {
    throw new AppError(
      400,
      "Trạng thái từ chối không được trùng trạng thái đích",
    );
  }
}

async function ensureTransitionInTemplate(
  templateId: number,
  workflowId: number,
  transitionId: number,
) {
  const workflow = await repo.findWorkflow(templateId, workflowId);
  if (!workflow) {
    throw new AppError(404, "Không tìm thấy workflow");
  }

  const transition = await repo.findTransition(workflowId, transitionId);
  if (!transition) {
    throw new AppError(404, "Không tìm thấy transition");
  }

  return transition;
}

async function assertProjectRoleInTemplate(
  templateId: number,
  projectRoleId: number,
) {
  const role = await repo.findProjectRole(templateId, projectRoleId);
  if (!role) {
    throw new AppError(400, "Project role không thuộc template này");
  }
}

async function assertRejectStatusInWorkflow(
  workflowId: number,
  onRejectStatusId: number,
) {
  const status = await repo.findStatus(workflowId, onRejectStatusId);
  if (!status) {
    throw new AppError(400, "Trạng thái từ chối không thuộc workflow này");
  }
}

export async function createApprovalRule(
  templateId: number,
  workflowId: number,
  transitionId: number,
  userId: number,
  input: CreateApprovalRuleInput,
) {
  await ensureDraftTemplate(templateId);

  const transition = await ensureTransitionInTemplate(
    templateId,
    workflowId,
    transitionId,
  );

  const fields: RuleFields = {
    approverType: input.approverType,
    projectRoleId: input.projectRoleId ?? null,
    taskRole: input.taskRole ?? null,
    minApprovals: input.minApprovals,
    onRejectStatusId: input.onRejectStatusId,
  };

  validateApprovalRuleFields(
    templateId,
    workflowId,
    transition.toStatusId,
    fields,
  );

  if (fields.projectRoleId) {
    await assertProjectRoleInTemplate(templateId, fields.projectRoleId);
  }

  await assertRejectStatusInWorkflow(workflowId, fields.onRejectStatusId);

  const rule = await repo.createApprovalRule({
    transition: { connect: { id: transitionId } },
    approverType: fields.approverType,
    ...(fields.projectRoleId
      ? { projectRole: { connect: { id: fields.projectRoleId } } }
      : {}),
    taskRole: fields.taskRole,
    minApprovals: fields.minApprovals,
    onRejectStatus: { connect: { id: fields.onRejectStatusId } },
  });

  await touchTemplate(templateId, userId);
  return rule;
}

export async function updateApprovalRule(
  templateId: number,
  workflowId: number,
  transitionId: number,
  ruleId: number,
  userId: number,
  input: UpdateApprovalRuleInput,
) {
  await ensureDraftTemplate(templateId);

  const transition = await ensureTransitionInTemplate(
    templateId,
    workflowId,
    transitionId,
  );

  const rule = await repo.findApprovalRule(transitionId, ruleId);
  if (!rule) {
    throw new AppError(404, "Không tìm thấy quy tắc duyệt");
  }

  const fields: RuleFields = {
    approverType: input.approverType ?? rule.approverType,
    projectRoleId:
      input.projectRoleId !== undefined
        ? input.projectRoleId
        : rule.projectRoleId,
    taskRole:
      input.taskRole !== undefined ? input.taskRole : rule.taskRole,
    minApprovals: input.minApprovals ?? rule.minApprovals,
    onRejectStatusId: input.onRejectStatusId ?? rule.onRejectStatusId,
  };

  validateApprovalRuleFields(
    templateId,
    workflowId,
    transition.toStatusId,
    fields,
  );

  if (fields.projectRoleId) {
    await assertProjectRoleInTemplate(templateId, fields.projectRoleId);
  }

  await assertRejectStatusInWorkflow(workflowId, fields.onRejectStatusId);

  try {
    const updated = await repo.updateApprovalRule(ruleId, {
      approverType: fields.approverType,
      ...(fields.projectRoleId
        ? { projectRole: { connect: { id: fields.projectRoleId } } }
        : { projectRole: { disconnect: true } }),
      taskRole: fields.taskRole,
      minApprovals: fields.minApprovals,
      onRejectStatus: { connect: { id: fields.onRejectStatusId } },
    });

    await touchTemplate(templateId, userId);
    return updated;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "Quy tắc duyệt không hợp lệ");
    }
    throw error;
  }
}

export async function deleteApprovalRule(
  templateId: number,
  workflowId: number,
  transitionId: number,
  ruleId: number,
  userId: number,
) {
  await ensureDraftTemplate(templateId);
  await ensureTransitionInTemplate(templateId, workflowId, transitionId);

  const rule = await repo.findApprovalRule(transitionId, ruleId);
  if (!rule) {
    throw new AppError(404, "Không tìm thấy quy tắc duyệt");
  }

  await repo.deleteApprovalRule(ruleId);
  await touchTemplate(templateId, userId);
}
