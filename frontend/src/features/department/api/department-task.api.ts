import { axiosClient } from "@/lib/axios";
import { departmentApiBase } from "@/features/department/context/department-scope";
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
      `${departmentApiBase()}/tasks`,
    );
  },

  create(payload: SaveDepartmentTaskPayload) {
    return axiosClient.post<ApiResponse<{ id: number; code: string }>>(
      `${departmentApiBase()}/tasks`,
      payload,
    );
  },

  get(taskId: number) {
    return axiosClient.get<ApiResponse<DepartmentTaskDetail>>(
      `${departmentApiBase()}/tasks/${taskId}`,
    );
  },

  update(taskId: number, payload: SaveDepartmentTaskPayload) {
    return axiosClient.patch<ApiResponse<DepartmentTaskDetail>>(
      `${departmentApiBase()}/tasks/${taskId}`,
      payload,
    );
  },

  remove(taskId: number) {
    return axiosClient.delete<ApiResponse<{ id: number }>>(
      `${departmentApiBase()}/tasks/${taskId}`,
    );
  },

  updateStatus(taskId: number, statusId: number) {
    return axiosClient.patch<ApiResponse<DepartmentTaskDetail>>(
      `${departmentApiBase()}/tasks/${taskId}/status`,
      { statusId },
    );
  },

  listComments(taskId: number) {
    return axiosClient.get<ApiResponse<TaskComment[]>>(
      `${departmentApiBase()}/tasks/${taskId}/comments`,
    );
  },

  createComment(
    taskId: number,
    payload: { content: string; attachmentIds: number[] },
  ) {
    return axiosClient.post<ApiResponse<TaskComment>>(
      `${departmentApiBase()}/tasks/${taskId}/comments`,
      payload,
    );
  },

  listAttachments(taskId: number) {
    return axiosClient.get<ApiResponse<TaskAttachmentGroups>>(
      `${departmentApiBase()}/tasks/${taskId}/attachments`,
    );
  },

  getConfig() {
    return axiosClient.get<ApiResponse<DepartmentTaskConfig>>(
      `${departmentApiBase()}/task-config`,
    );
  },

  saveConfig(payload: SaveTaskConfigPayload) {
    return axiosClient.put<ApiResponse<DepartmentTaskConfig>>(
      `${departmentApiBase()}/task-config`,
      payload,
    );
  },
};
