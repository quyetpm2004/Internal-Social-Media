import { uploadApi } from "@/features/uploads/api/upload.api";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function validateGroupCoverFile(file: File): string | null {
  if (!ACCEPT.split(",").includes(file.type)) {
    return "Ảnh bìa: chỉ hỗ trợ JPEG, PNG hoặc WebP";
  }

  if (file.size > MAX_SIZE) {
    return "Ảnh bìa: dung lượng tối đa 10MB";
  }

  return null;
}

export async function uploadGroupCover(
  file: File,
  groupId: string,
): Promise<void> {
  const validationError = validateGroupCoverFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const presignRes = await uploadApi.presign([
    {
      purpose: "group-cover",
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    },
  ]);

  const { uploadUrl, key } = presignRes.data.items[0];

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("UPLOAD_FAILED");
  }

  await uploadApi.confirm([
    {
      purpose: "group-cover",
      key,
      groupId: Number(groupId),
    },
  ]);
}
