import React from "react";
import NavItem from "@/components/common/NavItem"; // Component NavItem đã tạo ở bước trước
import {
  Bookmark,
  Group,
  LayoutGrid,
  MessageCircleCheck,
  User,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLocation } from "react-router-dom";

const AppSidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  return (
    <aside className="hidden md:flex flex-col gap-2 p-4 fixed left-0 top-16 h-[calc(100vh-64px)] w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      <nav className="flex-1 space-y-1">
        <NavItem
          icon={
            <div className="h-5 w-5 rounded-xl overflow-hidden bg-slate-200">
              <img
                alt="User profile"
                className="h-full w-full object-cover"
                data-alt="professional of a smiling architect in a modern office setting with soft natural light"
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}`
                }
              />
            </div>
          }
          active={isActive(`/profile/${user?.id}`)}
          label={user?.fullName || "Tài khoản"}
          path={`/profile/${user?.id}`}
        />
        <NavItem
          icon={<LayoutGrid size={20} />}
          active={isActive("/news-feed")}
          label="Trang chủ"
          path="/news-feed"
        />
        <NavItem
          icon={<Group size={20} />}
          active={isActive("/groups")}
          label="Không gian nhóm"
          path="/groups"
        />
        <NavItem
          icon={<User size={20} />}
          active={isActive("/people")}
          label="Bạn bè"
          path="/people"
        />
        <NavItem
          icon={<Bookmark size={20} />}
          active={isActive("/stats")}
          label="Đã lưu"
          path="/stats"
        />
        <NavItem
          icon={<MessageCircleCheck size={20} />}
          active={isActive("/messages")}
          label="Tin nhắn"
          path="/messages"
        />
      </nav>
    </aside>
  );
};

export default AppSidebar;
