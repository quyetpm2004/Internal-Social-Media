import { useRef, useState } from "react";
import { Camera, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { chatApi } from "@/features/chat/apis/chat.api";
import { uploadConversationAvatar } from "@/features/chat/utils/upload-conversation-avatar";
import type { ConversationDetail } from "@/features/chat/types/chat.type";

interface GroupAvatarMenuProps {
  conversation: ConversationDetail;
  isAdmin: boolean;
  onUpdated: (conversation: ConversationDetail) => void;
}

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
};

const GroupAvatarMenu = ({
  conversation,
  isAdmin,
  onUpdated,
}: GroupAvatarMenuProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePickFile = () => {
    fileInputRef.current?.click();
    setMenuOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setUploading(true);
      await uploadConversationAvatar(file, conversation.id);
      const res = await chatApi.getConversationDetail(conversation.id);
      onUpdated(res.data);
      toast.success("Cập nhật ảnh nhóm thành công");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setMenuOpen(false);
    try {
      setUploading(true);
      const res = await chatApi.deleteGroupAvatar(conversation.id);
      onUpdated(res.data);
      toast.success("Đã xóa ảnh nhóm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!isAdmin || uploading}
        onClick={() => isAdmin && setMenuOpen((prev) => !prev)}
        className={`relative w-32 h-32 rounded-2xl overflow-hidden shadow-xl border-4 border-surface-container-lowest transform rotate-2 bg-secondary-container flex items-center justify-center ${
          isAdmin ? "cursor-pointer hover:opacity-95" : "cursor-default"
        }`}
        aria-label={isAdmin ? "Chỉnh sửa ảnh nhóm" : "Ảnh nhóm"}
      >
        {conversation.avatarUrl ? (
          <img
            alt={conversation.name}
            className="w-full h-full object-cover"
            src={conversation.avatarUrl}
          />
        ) : (
          <Users size={48} className="text-on-secondary-container" />
        )}
        {isAdmin && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
            <Camera
              size={28}
              className="text-white opacity-0 hover:opacity-100 drop-shadow-md"
            />
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {menuOpen && isAdmin && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 min-w-[180px] rounded-xl bg-surface shadow-lg border border-outline-variant/30 py-1 overflow-hidden">
            <button
              type="button"
              onClick={handlePickFile}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <Camera size={16} />
              Chọn ảnh mới
            </button>
            {conversation.avatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-surface-container-high transition-colors"
              >
                <Trash2 size={16} />
                Xóa ảnh
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GroupAvatarMenu;
