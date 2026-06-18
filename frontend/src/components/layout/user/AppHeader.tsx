import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  Group,
  LogOut,
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
import { getDefaultAvatarUrl } from "@/lib/utils";
import NotificationBell from "@/features/notification/components/NotificationBell";
import MessengerBell, {
  MessengerBellMobile,
} from "@/features/chat/components/messenger/MessengerBell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
        {t("nav.groups")}
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
        {t("nav.saved")}
      </button>

      <div className="border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onToggleSettingsSubmenu}
          className={`${menuItemClass} justify-between`}
        >
          <span className="flex items-center gap-3">
            <Settings size={18} />
            {t("nav.settings")}
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
            {t("nav.forgotPassword")}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-200 dark:border-slate-700"
      >
        <LogOut size={18} />
        {t("common.logout")}
      </button>
    </>
  );
}

export default function AppHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        <div className="flex items-center gap-2 w-80">
          <span className="text-xl font-extrabold text-blue-700 dark:text-white tracking-tight pl-2 hidden md:block">
            <img src="/favicon.png" alt="Logo" className="w-10 h-10" />
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
        <div className="hidden md:flex shrink-0 flex-1 px-3">
          <SidebarTrigger />
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
          <NotificationBell />

          <MessengerBell />
          <MessengerBellMobile />

          <div className="relative hidden md:flex" ref={dropdownRef}>
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
                src={user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)}
              />
            </button>

            {openDropdown && (
              <div className="absolute right-0 top-10 w-60 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
                  {t("nav.profile")}
                </button>

                <button
                  onClick={() => {
                    // navigate(`/profile/${user?.id}`);
                    setOpenDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserKey size={18} />
                  {t("nav.changePassword")}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={18} />
                  {t("common.logout")}
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
                  src={user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)}
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
