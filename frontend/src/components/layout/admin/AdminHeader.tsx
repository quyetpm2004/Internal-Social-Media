import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/shared/Modal";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getDefaultAvatarUrl } from "@/lib/utils";

export default function AdminHeader() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-sky-100/80 bg-white/75 px-4 backdrop-blur-md">
      <SidebarTrigger />

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none hover:bg-slate-100"
            >
              <span className="relative">
                <img
                  className="size-8 rounded-full object-cover"
                  src={user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)}
                  alt={user?.fullName}
                />
                <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <span className="max-w-40 truncate text-sm font-medium text-slate-800">
                {user?.fullName}
              </span>
              <ChevronDown className="size-4 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium">{user?.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setShowLogoutConfirm(true)}
            >
              <LogOut />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Modal
        open={showLogoutConfirm}
        title={t("admin.logoutTitle")}
        description={t("admin.logoutDescription")}
        confirmText={t("common.logout")}
        variant="primary"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
      />
    </header>
  );
}
