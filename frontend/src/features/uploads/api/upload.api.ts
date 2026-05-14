import { axiosClient } from "@/lib/axios";

export const uploadApi = {
  presign(
    files: {
      purpose: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }[],
  ) {
    return axiosClient.post("/uploads/presign", {
      files,
    });
  },

  confirm(
    items: {
      purpose:
        | "avatar"
        | "group-avatar"
        | "group-cover"
        | "post-image"
        | "post-video"
        | "post-file";

      key: string;

      attachmentId?: number;

      groupId?: number;
    }[],
  ) {
    return axiosClient.post("/uploads/confirm", {
      items,
    });
  },
};
