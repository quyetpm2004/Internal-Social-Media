import { NavLink } from "react-router-dom";
import {
  ClipboardCheck,
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  UsersRound,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

const accents = {
  blue: {
    icon: "text-blue-500",
    active:
      "data-[active=true]:bg-blue-100! data-[active=true]:font-semibold! data-[active=true]:text-blue-800! data-[active=true]:hover:bg-blue-100! data-[active=true]:hover:text-blue-800!",
  },
  sky: {
    icon: "text-sky-500",
    active:
      "data-[active=true]:bg-sky-100! data-[active=true]:font-semibold! data-[active=true]:text-sky-800! data-[active=true]:hover:bg-sky-100! data-[active=true]:hover:text-sky-800!",
  },
  violet: {
    icon: "text-violet-500",
    active:
      "data-[active=true]:bg-violet-100! data-[active=true]:font-semibold! data-[active=true]:text-violet-800! data-[active=true]:hover:bg-violet-100! data-[active=true]:hover:text-violet-800!",
  },
  amber: {
    icon: "text-amber-500",
    active:
      "data-[active=true]:bg-amber-100! data-[active=true]:font-semibold! data-[active=true]:text-amber-800! data-[active=true]:hover:bg-amber-100! data-[active=true]:hover:text-amber-800!",
  },
  emerald: {
    icon: "text-emerald-500",
    active:
      "data-[active=true]:bg-emerald-100! data-[active=true]:font-semibold! data-[active=true]:text-emerald-800! data-[active=true]:hover:bg-emerald-100! data-[active=true]:hover:text-emerald-800!",
  },
  rose: {
    icon: "text-rose-500",
    active:
      "data-[active=true]:bg-rose-100! data-[active=true]:font-semibold! data-[active=true]:text-rose-800! data-[active=true]:hover:bg-rose-100! data-[active=true]:hover:text-rose-800!",
  },
  indigo: {
    icon: "text-indigo-500",
    active:
      "data-[active=true]:bg-indigo-100! data-[active=true]:font-semibold! data-[active=true]:text-indigo-800! data-[active=true]:hover:bg-indigo-100! data-[active=true]:hover:text-indigo-800!",
  },
} as const;

type Accent = keyof typeof accents;

const navItemClass = (isCollapsed: boolean, accent: Accent) =>
  cn(
    "h-10 w-full gap-3 text-base text-slate-600 [&_svg]:size-5!",
    accents[accent].active,
    isCollapsed && "justify-center p-0 group-data-[collapsible=icon]:size-10!",
  );

export default function AdminSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navItems = [
    {
      to: "/admin",
      label: t("admin.dashboard"),
      icon: LayoutDashboard,
      accent: "blue" as const,
      end: true,
    },
    {
      to: "/admin/users",
      label: t("admin.users"),
      icon: Users,
      accent: "sky" as const,
    },
    {
      to: "/admin/posts",
      label: t("admin.posts"),
      icon: FileText,
      accent: "violet" as const,
    },
    {
      to: "/admin/pending-posts",
      label: t("admin.pendingPosts"),
      icon: ClipboardCheck,
      accent: "amber" as const,
    },
    {
      to: "/admin/comments",
      label: t("admin.comments"),
      icon: MessageSquare,
      accent: "emerald" as const,
    },
    {
      to: "/admin/groups",
      label: t("admin.groups"),
      icon: UsersRound,
      accent: "rose" as const,
    },
    {
      to: "/admin/project-templates",
      label: t("admin.projectTemplates"),
      icon: LayoutTemplate,
      accent: "indigo" as const,
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-sky-100 font-headline **:data-[sidebar=sidebar]:bg-linear-to-b **:data-[sidebar=sidebar]:from-sky-50 **:data-[sidebar=sidebar]:to-white"
    >
      <SidebarHeader
        className={cn(
          "h-14 py-2 justify-center",
          isCollapsed ? "items-center" : "px-3",
        )}
      >
        {isCollapsed ? (
          <img
            className="size-7 rounded-full"
            src="/logo/logo.png"
            alt="logo"
          />
        ) : (
          <div className="flex items-center gap-2 px-2">
            <img
              className="size-7 rounded-full"
              src="/logo/logo.png"
              alt="logo"
            />
            <span className="font-semibold text-blue-950">
              {t("admin.panel")}
            </span>
          </div>
        )}
      </SidebarHeader>

      <Separator className="bg-sky-100" />

      <SidebarContent className={isCollapsed ? "p-0" : "p-3"}>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className="w-full justify-center flex"
                  >
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={navItemClass(isCollapsed, item.accent)}
                      >
                        <div>
                          <item.icon
                            className={cn(
                              accents[item.accent].icon,
                              "group-data-[active=true]/menu-button:text-current",
                            )}
                          />
                          <span
                            className={cn(
                              "transition-all text-sm",
                              isCollapsed && "hidden",
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
