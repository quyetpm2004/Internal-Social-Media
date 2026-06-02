import { uploadApi } from "@/features/uploads/api/upload.api";

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function validateConversationAvatarFile(file: File): string | null {
  if (!ACCEPT.split(",").includes(file.type)) {
    return "Ảnh nhóm: chỉ hỗ trợ JPEG, PNG hoặc WebP";
  }

  if (file.size > MAX_SIZE) {
    return "Ảnh nhóm: dung lượng tối đa 2MB";
  }

  return null;
}

export async function uploadConversationAvatar(
  file: File,
  conversationId: number,
): Promise<void> {
  const validationError = validateConversationAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const presignRes = await uploadApi.presign([
    {
      purpose: "conversation-avatar",
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
      purpose: "conversation-avatar",
      key,
      conversationId,
    },
  ]);
}
