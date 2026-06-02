import { axiosClient } from "@/lib/axios";

export type UploadPurpose =
  | "avatar"
  | "group-cover"
  | "conversation-avatar"
  | "post-image"
  | "post-video"
  | "post-file"
  | "message-image"
  | "message-video"
  | "message-file";

export interface PresignedItem {
  attachmentId: number | null;
  key: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
}

export interface PresignResponse {
  message: string;
  data: {
    items: PresignedItem[];
  };
}

export const uploadApi = {
  presign(
    files: {
      purpose: UploadPurpose;
      fileName: string;
      fileType: string;
      fileSize: number;
    }[],
  ) {
    return axiosClient.post<PresignResponse>("/uploads/presign", {
      files,
    });
  },

  confirm(
    items: {
      purpose: UploadPurpose;
      key: string;
      attachmentId?: number;
      groupId?: number;
      conversationId?: number;
    }[],
  ) {
    return axiosClient.post("/uploads/confirm", {
      items,
    });
  },
};
