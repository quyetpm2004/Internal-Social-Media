import { useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Code2,
  FolderKanban,
  Layers,
  Search,
  Store,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { APP_CONFIG } from "@/constants/app";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import WorkspaceSwitcher from "@/components/layout/work/WorkspaceSwitcher";
import WorkUserMenu from "@/components/layout/work/WorkUserMenu";
import NotificationBell from "@/features/notification/components/NotificationBell";
import { cn } from "@/lib/utils";

type WorkSidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
};

const mainLinks: NavItem[] = [
  { to: "/work", labelKey: "nav.orgOverview", icon: Building2, end: true },
  { to: "/work/mine", labelKey: "nav.myWork", icon: Briefcase },
];

const spaceLinks: NavItem[] = [
  { to: "/work/spaces/personal", labelKey: "nav.personal", icon: UserRound },
  { to: "/projects", labelKey: "nav.projects", icon: FolderKanban },
];

const moreLinks: NavItem[] = [
  { to: "/work/spaces/sales", labelKey: "nav.salesSpace", icon: Store },
  { to: "/work/spaces/engineering", labelKey: "nav.engineeringSpace", icon: Code2 },
];

function SidebarLink({
  item,
  label,
  nested,
  onNavigate,
}: {
  item: NavItem;
  label: string;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
          nested && "ml-2",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        )
      }
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(
    pathname.startsWith("/work/spaces/sales") ||
      pathname.startsWith("/work/spaces/engineering"),
  );

  const normalized = query.trim().toLowerCase();
  const matches = (labelKey: string) =>
    !normalized || t(labelKey).toLowerCase().includes(normalized);

  const visibleMain = mainLinks.filter((item) => matches(item.labelKey));
  const visibleSpaces = spaceLinks.filter((item) => matches(item.labelKey));
  const visibleMore = moreLinks.filter((item) => matches(item.labelKey));
  const moreRouteActive =
    pathname.startsWith("/work/spaces/sales") ||
    pathname.startsWith("/work/spaces/engineering");
  const showMore = normalized
    ? visibleMore.length > 0
    : moreOpen || moreRouteActive;
  const nothing =
    visibleMain.length === 0 &&
    visibleSpaces.length === 0 &&
    visibleMore.length === 0 &&
    !matches("nav.spaces") &&
    !matches("nav.seeMore");

  const spaceHeadingVisible =
    !normalized ||
    matches("nav.spaces") ||
    visibleSpaces.length > 0 ||
    visibleMore.length > 0;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="" className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900">
              {APP_CONFIG.appName}
            </p>
            <p className="truncate text-[11px] text-slate-400">{t("nav.workPlan")}</p>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400">
          <Search className="size-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("nav.searchWork")}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {visibleMain.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            label={t(item.labelKey)}
            onNavigate={onNavigate}
          />
        ))}

        {spaceHeadingVisible && (
          <p className="px-3 pt-4 pb-1 text-xs font-medium text-slate-400">
            {t("nav.spaces")}
          </p>
        )}

        {visibleSpaces.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            label={t(item.labelKey)}
            nested
            onNavigate={onNavigate}
          />
        ))}

        {(normalized ? visibleMore.length > 0 : true) && matches("nav.seeMore") && (
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className="ml-2 flex w-[calc(100%-0.5rem)] cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <Layers className="size-[18px] shrink-0" />
            <span className="flex-1 text-left">{t("nav.seeMore")}</span>
            <ChevronDown
              className={cn(
                "size-4 text-slate-400 transition-transform",
                showMore && "rotate-180",
              )}
            />
          </button>
        )}

        {showMore &&
          visibleMore.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              label={t(item.labelKey)}
              nested
              onNavigate={onNavigate}
            />
          ))}

        {nothing && (
          <p className="px-3 py-6 text-center text-xs text-slate-400">
            {t("nav.noMatch")}
          </p>
        )}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <WorkspaceSwitcher compact className="mb-2" />
        <div className="flex items-center justify-between">
          <LanguageSwitcher />
          <div className="flex items-center gap-1">
            <div className="[&_.absolute]:!left-full [&_.absolute]:!right-auto [&_.absolute]:ml-2">
              <NotificationBell />
            </div>
            <WorkUserMenu placement="up" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkSidebar({ open, onClose }: WorkSidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      <aside className="sticky top-0 z-20 hidden h-svh w-[248px] shrink-0 border-r border-slate-200 md:block">
        <SidebarBody />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label={t("common.close")}
            className="absolute inset-0 bg-slate-900/40"
            onClick={onClose}
          />
          <aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarBody onNavigate={onClose} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
