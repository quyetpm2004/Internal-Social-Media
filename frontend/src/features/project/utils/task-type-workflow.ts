type TaskTypeWorkflow = {
  workflowId: number | null;
};

type WorkflowMatch = {
  id: number;
  isDefault: boolean;
};

/** Loại việc workflowId null đi theo quy trình mặc định của dự án. */
export function taskTypeMatchesWorkflow(
  taskType: TaskTypeWorkflow,
  workflow: WorkflowMatch | null | undefined,
) {
  if (!workflow) return false;
  if (taskType.workflowId === workflow.id) return true;
  return taskType.workflowId == null && workflow.isDefault;
}
