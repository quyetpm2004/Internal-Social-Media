import { Camera } from "lucide-react";
import React from "react";

interface HeaderProps {
  name: string;
  role: string | undefined;
  department: string | undefined;
  isEditing: boolean;
  updating: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const ProfileHeader: React.FC<HeaderProps> = ({
  name,
  role,
  department,
  isEditing,
  updating,
  onEdit,
  onCancel,
  onSubmit,
}) => (
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
          src="https://khoanhdep.com/wp-content/uploads/2025/09/anh-anime-nam-2.jpg"
        />
        <button className="absolute bottom-2 right-2 p-1.5 bg-white rounded-lg shadow-md text-blue-700 hover:bg-slate-50 cursor-pointer">
          <Camera size={20} />
        </button>
      </div>
      <div className="flex-1 pb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {name}
        </h1>
        <p className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-2">
          {role} <span className="h-1.5 w-1.5 bg-blue-700 rounded-full"></span>{" "}
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
  </div>
);

export default ProfileHeader;
