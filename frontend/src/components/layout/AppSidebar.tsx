import React from "react";
import NavItem from "@/components/common/NavItem"; // Component NavItem đã tạo ở bước trước
import {
  BarChart,
  Bookmark,
  Group,
  Home,
  LayoutDashboard,
  Plus,
  User,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";

const AppSidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <aside className="hidden md:flex flex-col gap-2 p-4 fixed left-0 top-16 h-[calc(100vh-64px)] w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      <nav className="flex-1 space-y-1">
        <NavItem
          icon={
            <div className="h-6 w-6 rounded-xl overflow-hidden bg-slate-200">
              <img
                alt="User profile"
                className="h-full w-full object-cover"
                data-alt="professional headshot of a smiling architect in a modern office setting with soft natural light"
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=0D8ABC&color=fff&size=128`
                }
              />
            </div>
          }
          label={user?.fullName || "Tài khoản"}
          path="/profile"
        />
        <NavItem icon={<Home size={24} />} label="Trang chủ" path="/" />
        <NavItem
          icon={<Group size={24} />}
          label="Nhóm của tôi"
          path="/projects"
        />
        <NavItem icon={<User size={24} />} label="Bạn bè" path="/people" />
        <NavItem icon={<Bookmark size={24} />} label="Đã lưu" path="/stats" />
      </nav>

      <button className="mt-auto mb-4 w-full bg-linear-to-br cursor-pointer from-blue-700 to-blue-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all">
        <Plus />
        <span>Tạo bài viết</span>
      </button>
    </aside>
  );
};

export default AppSidebar;
