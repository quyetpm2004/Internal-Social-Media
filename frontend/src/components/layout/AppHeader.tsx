import { useEffect, useRef, useState } from "react";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Mail,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function AppHeader() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [openDropdown, setOpenDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        <div className="flex items-center gap-4 pr-4">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Bell size={20} />
          </button>

          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Mail size={20} />
          </button>

          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Settings size={20} />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpenDropdown((prev) => !prev)}
              className="h-10 w-10 rounded-xl overflow-hidden bg-slate-200 ml-2 border border-slate-200 dark:border-slate-700"
            >
              <img
                alt="User profile"
                className="h-full w-full object-cover"
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.fullName || "User",
                  )}&background=0D8ABC&color=fff&size=128`
                }
              />
            </button>

            {openDropdown && (
              <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    {user?.fullName}
                  </p>

                  <p className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigate(`/profile/${user?.id}`);
                    setOpenDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <User size={18} />
                  Hồ sơ cá nhân
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
