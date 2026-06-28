import ConfirmModal from "@/components/common/ConfirmModal";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { Camera, KeyRound, MessageCircle, Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  userId: string;
  isOwner: boolean;
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
  onOpenChangePasswordModal: () => void;
}

const ProfileHeader: React.FC<HeaderProps> = ({
  userId,
  isOwner,
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
  onOpenChangePasswordModal,
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

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
            src={avatarUrl || getDefaultAvatarUrl(name)}
          />

          {isOwner && (
            <>
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
            </>
          )}
        </div>

        <div className="flex-1 pb-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight md:text-left text-right">
            {name}
          </h1>
          <p className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-2  md:text-left text-right">
            {role}
            <span className="h-1.5 w-1.5 bg-blue-700 rounded-full"></span>
            {department}
          </p>
        </div>

        {isOwner ? (
          <div className="flex items-center gap-3 pb-2">
            {isOwner && (
              <button
                type="button"
                onClick={onOpenChangePasswordModal}
                className="cursor-pointer px-6 rounded-xl mt-auto bg-blue-100/80 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <KeyRound size={16} /> {t("profile.changePassword")}
              </button>
            )}
            {!isEditing ? (
              <button
                onClick={onEdit}
                className="cursor-pointer px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm shadow-lg hover:bg-blue-800 transition-all"
              >
                {t("profile.edit")}
              </button>
            ) : (
              <>
                <button
                  onClick={onCancel}
                  disabled={updating}
                  className="cursor-pointer px-6 py-2.5 rounded-xl text-slate-600 bg-slate-100 font-semibold text-sm hover:bg-slate-200"
                >
                  {t("profile.cancel")}
                </button>
                <button
                  onClick={onSubmit}
                  disabled={updating}
                  className="cursor-pointer px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm shadow-lg hover:bg-blue-800 transition-all"
                >
                  {updating ? t("profile.updating") : t("profile.save")}
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => navigate(`/messages/${userId}`)}
              className="cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm shadow-lg hover:bg-blue-800 transition-all"
            >
              <MessageCircle size={20} />
              {t("profile.sendMessage")}
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          open={showDeleteConfirm}
          title="Xóa ảnh đại diện?"
          description="Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại không?"
          confirmText="Xóa"
          cancelText="Hủy"
          loading={avatarUploading}
          variant="danger"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onAvatarDelete();
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </div>
  );
};

export default ProfileHeader;
