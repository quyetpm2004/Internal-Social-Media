import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { APP_CONFIG } from "@/constants/app";
import NotificationBell from "@/features/notification/components/NotificationBell";
import WorkUserMenu from "@/components/layout/work/WorkUserMenu";

type WorkHeaderProps = {
  onOpenMenu: () => void;
};

export default function WorkHeader({ onOpenMenu }: WorkHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur-md md:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label={t("nav.work")}
        >
          <Menu className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => navigate("/work")}
          className="flex items-center gap-2"
        >
          <img src="/favicon.png" alt="" className="size-8" />
          <span className="truncate text-sm font-bold tracking-tight text-slate-900">
            {APP_CONFIG.appName}
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <WorkUserMenu />
      </div>
    </header>
  );
}
