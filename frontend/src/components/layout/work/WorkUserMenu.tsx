import { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

type WorkUserMenuProps = {
  placement?: "down" | "up";
};

export default function WorkUserMenu({ placement = "down" }: WorkUserMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="size-8 cursor-pointer overflow-hidden rounded-full border border-slate-200 bg-slate-200"
        aria-label={t("nav.account")}
      >
        <img
          alt={user?.fullName || t("nav.account")}
          className="size-full object-cover"
          src={user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)}
        />
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
            placement === "up" ? "bottom-11 left-0" : "top-10 right-0",
          )}
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.fullName}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(`/profile/${user?.id}`);
            }}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="size-4" />
            {t("nav.profile")}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50"
          >
            <LogOut className="size-4" />
            {t("common.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
