import { axiosClient } from "@/lib/axios";

export const uploadApi = {
  presign(data: {
    purpose: "avatar";
    fileName: string;
    fileType: string;
    fileSize: number;
  }) {
    return axiosClient.post("/uploads/presign", data);
  },

  confirm(data: { purpose: "avatar"; key: string; fileName: string }) {
    return axiosClient.post("/uploads/confirm", data);
  },
};
