import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronDown,
  Group,
  LogOut,
  MessageCircleCheck,
  Search,
  Settings,
  TextAlignJustify,
  User,
  UserKey,
} from "lucide-react";
import SearchBar from "@/features/search/components/SearchBar";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { APP_CONFIG } from "@/constants/app";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type UserMenuPanelProps = {
  onClose: () => void;
  openSettingsSubmenu: boolean;
  onToggleSettingsSubmenu: () => void;
  onLogout: () => void;
};

function UserMenuPanel({
  onClose,
  openSettingsSubmenu,
  onToggleSettingsSubmenu,
  onLogout,
}: UserMenuPanelProps) {
  const navigate = useNavigate();

  const menuItemClass =
    "w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          navigate("/groups");
          onClose();
        }}
        className={menuItemClass}
      >
        <Group size={18} />
        Không gian nhóm
      </button>

      <button
        type="button"
        onClick={() => {
          navigate("/stats");
          onClose();
        }}
        className={menuItemClass}
      >
        <Bookmark size={18} />
        Đã lưu
      </button>

      <div className="border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onToggleSettingsSubmenu}
          className={`${menuItemClass} justify-between`}
        >
          <span className="flex items-center gap-3">
            <Settings size={18} />
            Cài đặt
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-200 ${
              openSettingsSubmenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSettingsSubmenu && (
          <button
            type="button"
            onClick={() => {
              navigate("/login");
              onClose();
            }}
            className="w-full pl-11 pr-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            Quên mật khẩu
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-200 dark:border-slate-700"
      >
        <LogOut size={18} />
        Đăng xuất
      </button>
    </>
  );
}

export default function AppHeader() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [openDropdown, setOpenDropdown] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openSettingsSubmenu, setOpenSettingsSubmenu] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const closeDropdown = () => {
    setOpenDropdown(false);
    setOpenSettingsSubmenu(false);
  };

  const closeMobileMenu = () => {
    setOpenMobileMenu(false);
    setOpenSettingsSubmenu(false);
  };

  const handleLogout = async () => {
    closeDropdown();
    closeMobileMenu();
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between h-16 w-full max-w-full">
        <div className="flex items-center gap-4 w-80">
          <span className="text-xl font-extrabold text-blue-700 dark:text-white tracking-tight pr-2 pl-3 hidden md:block">
            <img src="/logo/logo.png" alt="Logo" className="w-20 h-10" />
          </span>

          <div className="flex gap-3 items-center px-3 md:hidden">
            <button
              type="button"
              onClick={() => setOpenMobileMenu(true)}
              className="p-1 -m-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Mở menu"
            >
              <TextAlignJustify size={24} />
            </button>
            <span
              className="text-primary text-2xl font-bold "
              onClick={() => navigate("/news-feed")}
            >
              {APP_CONFIG.appName}
            </span>
          </div>

          <SearchBar />
        </div>

        <div className="flex items-center gap-4 pr-4">
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200 md:hidden"
            aria-label="Tìm kiếm"
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200"
          >
            <Bell size={20} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200"
            aria-label="Tin nhắn"
          >
            <MessageCircleCheck size={20} />
          </button>

          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() =>
                setOpenDropdown((prev) => {
                  if (prev) setOpenSettingsSubmenu(false);
                  return !prev;
                })
              }
              className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 ml-2 border border-slate-200 dark:border-slate-700"
            >
              <img
                alt="User profile"
                className="h-full w-full object-cover"
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.fullName || "User",
                  )}`
                }
              />
            </button>

            {openDropdown && (
              <div className="absolute right-0 w-60 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
                  onClick={() => {
                    // navigate(`/profile/${user?.id}`);
                    setOpenDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserKey size={18} />
                  Thay đổi mật khẩu
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

      <Sheet
        open={openMobileMenu}
        onOpenChange={(open) => {
          setOpenMobileMenu(open);
          if (!open) setOpenSettingsSubmenu(false);
        }}
      >
        <SheetContent
          side="left"
          className="w-[min(100%,280px)] p-0 gap-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        >
          <SheetHeader className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-left">
            <div className="flex items-center gap-3 pr-8">
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-slate-200 border border-slate-200 dark:border-slate-700">
                <img
                  alt="User profile"
                  className="h-full w-full object-cover"
                  src={
                    user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.fullName || "User",
                    )}`
                  }
                />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-sm font-semibold truncate">
                  {user?.fullName}
                </SheetTitle>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </SheetHeader>

          <nav className="flex flex-col py-2">
            <UserMenuPanel
              onClose={closeMobileMenu}
              openSettingsSubmenu={openSettingsSubmenu}
              onToggleSettingsSubmenu={() =>
                setOpenSettingsSubmenu((prev) => !prev)
              }
              onLogout={handleLogout}
            />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
