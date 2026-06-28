import { NavLink } from "react-router-dom";
import {
  Bookmark,
  Group,
  Languages,
  LayoutGrid,
  MessageCircleCheck,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn, getDefaultAvatarUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const menuButtonClass = (isActive: boolean, isCollapsed: boolean) =>
  cn(
    "gap-3 rounded-lg font-medium text-sm transition-all",
    isActive
      ? "bg-white dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-semibold hover:bg-white dark:hover:bg-blue-900/20"
      : "text-slate-600 dark:text-slate-400 hover:text-primary-900 dark:hover:text-primary-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50",
    isCollapsed && "justify-center size-9 p-0",
  );

export default function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const { state } = useSidebar();
  const { t, i18n } = useTranslation();
  const isCollapsed = state === "collapsed";
  const profilePath = `/profile/${user?.id}`;
  const navItems = [
    { to: "/news-feed", label: t("nav.home"), icon: LayoutGrid },
    { to: "/groups", label: t("nav.groups"), icon: Group },
    { to: "/stats", label: t("nav.saved"), icon: Bookmark },
    { to: "/messages", label: t("nav.messages"), icon: MessageCircleCheck },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="top-16 h-[calc(100svh-4rem)]  border-slate-200 dark:border-slate-800 **:data-[sidebar=sidebar]:bg-slate-50 **:data-[sidebar=sidebar]:dark:bg-slate-950"
    >
      <SidebarContent className="bg-slate-100">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <NavLink to={profilePath} className="w-full flex pb-2">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={user?.fullName || t("nav.account")}
                      className={
                        menuButtonClass(isActive, isCollapsed) + " h-auto"
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-200">
                          <img
                            alt="User profile"
                            className="h-full w-full object-cover"
                            src={
                              user?.avatarUrl ||
                              getDefaultAvatarUrl(user?.fullName)
                            }
                          />
                        </div>
                        <span
                          className={cn("truncate", isCollapsed && "hidden")}
                        >
                          {user?.fullName || t("nav.account")}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <NavLink to={item.to} className="w-full flex">
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={
                          menuButtonClass(isActive, isCollapsed) + " h-auto"
                        }
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-6! shrink-0" />
                          <span
                            className={cn("truncate", isCollapsed && "hidden")}
                          >
                            {item.label}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <div
                  onClick={() =>
                    i18n.changeLanguage(
                      i18n.language.startsWith("vi") ? "en" : "vi",
                    )
                  }
                  className={cn(
                    "w-full flex items-center",
                    isCollapsed && "justify-center",
                  )}
                >
                  <SidebarMenuButton
                    tooltip={t("nav.languageToggle")}
                    className={
                      menuButtonClass(false, isCollapsed) + " h-auto w-full"
                    }
                  >
                    <Languages className="size-6! shrink-0" />
                    <span className={cn("truncate", isCollapsed && "hidden")}>
                      {i18n.language.startsWith("vi")
                        ? t("languageName.vi")
                        : t("languageName.en")}
                    </span>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
