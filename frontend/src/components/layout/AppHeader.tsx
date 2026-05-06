import {
  Bell,
  LayoutDashboard,
  LogOut,
  Mail,
  Search,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function AppHeader() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between h-16 w-full max-w-full">
        <div className="flex items-center gap-4 w-80">
          <span className="text-xl font-extrabold text-blue-700 dark:text-white tracking-tight pr-2 pl-3">
            <LayoutDashboard size={26} />
          </span>
          <div className="hidden md:flex items-center bg-surface-container-highest px-2 py-2 w-full rounded-lg gap-3">
            <Search size={20} />
            <input
              className="bg-transparent focus:ring-0 text-sm w-full placeholder-on-surface-variant border-none focus-visible:outline-none py-1"
              placeholder="Tìm kiếm..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Bell size={20} />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Mail size={20} />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Settings size={20} />
          </button>
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-200 ml-2">
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
        </div>
      </div>
    </header>
  );
}
