import React from "react";
import NavItem from "@/components/common/NavItem"; // Component NavItem đã tạo ở bước trước
import { BarChart, Home, LayoutDashboard, Plus, User } from "lucide-react";

const AppSidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col gap-2 p-4 fixed left-0 top-16 h-[calc(100vh-64px)] w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      <nav className="flex-1 space-y-1">
        <NavItem icon={<Home size={20} />} label="Trang chủ" active path="/" />
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dự án"
          path="/projects"
        />
        <NavItem icon={<User size={20} />} label="Bạn bè" path="/people" />
        <NavItem icon={<BarChart size={20} />} label="Thống kê" path="/stats" />
      </nav>

      <button className="mt-auto mb-4 w-full bg-linear-to-br cursor-pointer from-blue-700 to-blue-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all">
        <Plus />
        <span>Tạo bài viết</span>
      </button>
    </aside>
  );
};

export default AppSidebar;
