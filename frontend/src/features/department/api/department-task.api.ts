import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  TaskAttachmentGroups,
  TaskComment,
} from "@/features/project/types/task.type";
import type {
  DepartmentTaskConfig,
  DepartmentTaskDetail,
  DepartmentTaskList,
  SaveDepartmentTaskPayload,
  SaveTaskConfigPayload,
} from "@/features/department/types/department-task.type";

export const departmentTaskApi = {
  list() {
    return axiosClient.get<ApiResponse<DepartmentTaskList>>(
      "/departments/me/tasks",
    );
  },

  create(payload: SaveDepartmentTaskPayload) {
    return axiosClient.post<ApiResponse<{ id: number; code: string }>>(
      "/departments/me/tasks",
      payload,
    );
  },

  get(taskId: number) {
    return axiosClient.get<ApiResponse<DepartmentTaskDetail>>(
      `/departments/me/tasks/${taskId}`,
    );
  },

  update(taskId: number, payload: SaveDepartmentTaskPayload) {
    return axiosClient.patch<ApiResponse<DepartmentTaskDetail>>(
      `/departments/me/tasks/${taskId}`,
      payload,
    );
  },

  remove(taskId: number) {
    return axiosClient.delete<ApiResponse<{ id: number }>>(
      `/departments/me/tasks/${taskId}`,
    );
  },

  updateStatus(taskId: number, statusId: number) {
    return axiosClient.patch<ApiResponse<DepartmentTaskDetail>>(
      `/departments/me/tasks/${taskId}/status`,
      { statusId },
    );
  },

  listComments(taskId: number) {
    return axiosClient.get<ApiResponse<TaskComment[]>>(
      `/departments/me/tasks/${taskId}/comments`,
    );
  },

  createComment(
    taskId: number,
    payload: { content: string; attachmentIds: number[] },
  ) {
    return axiosClient.post<ApiResponse<TaskComment>>(
      `/departments/me/tasks/${taskId}/comments`,
      payload,
    );
  },

  listAttachments(taskId: number) {
    return axiosClient.get<ApiResponse<TaskAttachmentGroups>>(
      `/departments/me/tasks/${taskId}/attachments`,
    );
  },

  getConfig() {
    return axiosClient.get<ApiResponse<DepartmentTaskConfig>>(
      "/departments/me/task-config",
    );
  },

  saveConfig(payload: SaveTaskConfigPayload) {
    return axiosClient.put<ApiResponse<DepartmentTaskConfig>>(
      "/departments/me/task-config",
      payload,
    );
  },
};
