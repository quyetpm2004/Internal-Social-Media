import { PrismaClient } from "@prisma/client";

/** Xóa dự án cùng giai đoạn, cột mốc và công việc để tạo lại cho sạch. */
export async function clearProjects(prisma: PrismaClient) {
  const count = await prisma.project.count();
  if (count === 0) return;

  await prisma.$transaction(
    async (tx) => {
      await tx.task.updateMany({
        data: { parentTaskId: null, phaseId: null },
      });
      await tx.projectMilestoneTask.deleteMany();
      await tx.taskCommentAttachment.deleteMany();
      await tx.taskComment.deleteMany();
      await tx.taskAttachment.deleteMany();
      await tx.taskMember.deleteMany();
      await tx.task.deleteMany();
      await tx.projectMilestone.deleteMany();
      await tx.projectPhase.deleteMany();
      await tx.projectApprovalRule.deleteMany();
      await tx.projectWorkflowTransition.deleteMany();
      await tx.workflowStatus.deleteMany();
      await tx.projectTaskType.deleteMany();
      await tx.workflow.deleteMany();
      await tx.projectMember.deleteMany();
      await tx.projectRole.deleteMany();
      await tx.project.deleteMany();
    },
    { timeout: 120_000 },
  );

  console.log(`Đã gỡ ${count} dự án cũ để tạo lại.`);
}
