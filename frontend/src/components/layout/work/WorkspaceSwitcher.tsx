import { FolderKanban, LayoutGrid } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type WorkspaceSwitcherProps = {
  compact?: boolean;
  className?: string;
};

export default function WorkspaceSwitcher({
  compact = false,
  className,
}: WorkspaceSwitcherProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const workActive =
    pathname === "/work" ||
    pathname.startsWith("/work/") ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/");

  const itemClass = (isActive: boolean) =>
    cn(
      "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors",
      compact ? "size-9" : "h-9 px-3 text-sm",
      isActive
        ? "bg-white text-primary shadow-sm"
        : "text-slate-500 hover:text-slate-800",
    );

  return (
    <nav
      aria-label={t("nav.workspace")}
      className={cn(
        "inline-flex items-center rounded-xl bg-slate-100 p-1",
        className,
      )}
    >
      <Link
        to="/news-feed"
        title={t("nav.social")}
        aria-current={workActive ? undefined : "page"}
        className={itemClass(!workActive)}
      >
        <LayoutGrid className="size-4 shrink-0" />
        {!compact && <span>{t("nav.social")}</span>}
      </Link>
      <Link
        to="/work"
        title={t("nav.work")}
        aria-current={workActive ? "page" : undefined}
        className={itemClass(workActive)}
      >
        <FolderKanban className="size-4 shrink-0" />
        {!compact && <span>{t("nav.work")}</span>}
      </Link>
    </nav>
  );
}
