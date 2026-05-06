import { Camera, Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";

interface HeaderProps {
  name: string;
  role: string | undefined;
  department: string | undefined;
  avatarUrl: string | null;
  isEditing: boolean;
  updating: boolean;
  avatarUploading?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  onAvatarChange: (file: File) => void;
  onAvatarDelete: () => void;
}

const ProfileHeader: React.FC<HeaderProps> = ({
  name,
  role,
  avatarUrl,
  department,
  isEditing,
  updating,
  avatarUploading,
  onEdit,
  onCancel,
  onSubmit,
  onAvatarChange,
  onAvatarDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onAvatarChange(file);

    e.target.value = "";
  };

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden mb-8 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="h-48 w-full bg-linear-to-r from-blue-700 to-blue-500 opacity-90 relative">
        <img
          alt="cover"
          className="w-full h-full object-cover mix-blend-overlay"
          src="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2023/07/anh-bia-dep-10.jpg"
        />
      </div>

      <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-16 gap-6 relative">
        <div className="h-40 w-40 rounded-xl border-4 border-white dark:border-slate-900 bg-slate-200 shadow-xl overflow-hidden relative">
          <img
            alt="Avatar"
            className="h-full w-full object-cover"
            src={
              avatarUrl ||
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(name) +
                "&background=0D8ABC&color=fff&size=128"
            }
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleSelectAvatar}
          />

          <button
            type="button"
            disabled={avatarUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 p-1.5 bg-white rounded-lg shadow-md text-blue-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
          >
            <Camera size={20} />
          </button>

          <button
            type="button"
            disabled={avatarUploading || !avatarUrl}
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-md text-red-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 pb-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {name}
          </h1>
          <p className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-2">
            {role}
            <span className="h-1.5 w-1.5 bg-blue-700 rounded-full"></span>
            {department}
          </p>
        </div>

        <div className="flex items-center gap-3 pb-2">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm shadow-lg hover:bg-blue-800 transition-all"
            >
              Chỉnh sửa
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                disabled={updating}
                className="px-6 py-2.5 rounded-xl text-slate-600 bg-slate-100 font-semibold text-sm hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={onSubmit}
                disabled={updating}
                className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm shadow-lg hover:bg-blue-800 transition-all"
              >
                {updating ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Xóa ảnh đại diện?
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại không?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => {
                  onAvatarDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60"
              >
                {avatarUploading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
