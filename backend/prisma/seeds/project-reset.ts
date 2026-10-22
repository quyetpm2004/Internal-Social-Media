import { PrismaClient } from "@prisma/client";

/** Xóa dự án cùng giai đoạn, cột mốc và công việc để tạo lại cho sạch. */
export async function clearProjects(prisma: PrismaClient) {
  const count = await prisma.project.count();
  if (count === 0) return;

  await prisma.$transaction(
    async (tx) => {
      await tx.projectTask.updateMany({
        data: { parentTaskId: null, phaseId: null },
      });
      await tx.projectMilestoneTask.deleteMany();
      await tx.projectTaskCommentAttachment.deleteMany();
      await tx.projectTaskComment.deleteMany();
      await tx.projectTaskAttachment.deleteMany();
      await tx.projectTaskMember.deleteMany();
      await tx.projectTask.deleteMany();
      await tx.projectMilestone.deleteMany();
      await tx.projectPhase.deleteMany();
      await tx.projectApprovalRule.deleteMany();
      await tx.projectWorkflowTransition.deleteMany();
      await tx.projectWorkflowStatus.deleteMany();
      await tx.projectTaskType.deleteMany();
      await tx.projectWorkflow.deleteMany();
      await tx.projectMember.deleteMany();
      await tx.projectRole.deleteMany();
      await tx.project.deleteMany();
    },
    { timeout: 120_000 },
  );

  console.log(`Đã gỡ ${count} dự án cũ để tạo lại.`);
}
