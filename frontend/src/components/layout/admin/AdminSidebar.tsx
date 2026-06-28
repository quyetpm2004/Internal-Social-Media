import { useState } from "react";
import { NavLink } from "react-router-dom";
import ConfirmModal from "@/components/common/ConfirmModal";
import {
  ClipboardCheck,
  LayoutDashboard,
  Languages,
  MessageSquare,
  Users,
  FileText,
  UsersRound,
  LogOut,
} from "lucide-react";
import { cn, getDefaultAvatarUrl } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useTranslation } from "react-i18next";

export default function AdminSidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { t, i18n } = useTranslation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navItems = [
    {
      to: "/admin",
      label: t("admin.dashboard"),
      icon: LayoutDashboard,
      end: true,
    },
    { to: "/admin/users", label: t("admin.users"), icon: Users },
    { to: "/admin/posts", label: t("admin.posts"), icon: FileText },
    {
      to: "/admin/pending-posts",
      label: t("admin.pendingPosts"),
      icon: ClipboardCheck,
    },
    { to: "/admin/comments", label: t("admin.comments"), icon: MessageSquare },
    { to: "/admin/groups", label: t("admin.groups"), icon: UsersRound },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className={cn("h-10 py-2", isCollapsed ? "items-center" : "px-3")}
      >
        {isCollapsed ? (
          <img
            className="size-5 rounded-full"
            src="/logo/logo.png"
            alt="logo"
          />
        ) : (
          <div className="flex items-center gap-2 px-2">
            <img
              className="size-5 rounded-full"
              src="/logo/logo.png"
              alt="logo"
            />
            <span className="text-sm font-semibold">{t("admin.panel")}</span>
          </div>
        )}
      </SidebarHeader>

      <Separator />

      <SidebarContent className="p-3">
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
                        className={cn(
                          "w-full gap-2 text-sidebar-foreground",
                          isCollapsed && "justify-center p-0 size-9",
                        )}
                      >
                        <div>
                          <item.icon className="size-4" />
                          <span
                            className={cn(
                              "transition-all",
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
              <SidebarMenuItem>
                <div
                  onClick={() =>
                    i18n.changeLanguage(
                      i18n.language.startsWith("vi") ? "en" : "vi",
                    )
                  }
                  className="w-full justify-center flex"
                >
                  <SidebarMenuButton
                    tooltip={t("nav.languageToggle")}
                    className={cn(
                      "w-full gap-2 text-sidebar-foreground",
                      isCollapsed && "justify-center p-0 size-9",
                    )}
                  >
                    <Languages className="size-4" />
                    <span
                      className={cn("transition-all", isCollapsed && "hidden")}
                    >
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

      <Separator />

      {/* Footer chứa nút quay về */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="justify-center flex">
              <div className="flex items-center gap-2 justify-center">
                {isCollapsed ? (
                  <img
                    className="size-4! rounded-full"
                    src={user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)}
                    alt={user?.fullName}
                  />
                ) : (
                  <>
                    <img
                      className="size-8 rounded-full"
                      src={
                        user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)
                      }
                      alt={user?.fullName}
                    />
                    <div className="text-sm font-medium">
                      <p className="text-sm font-medium">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ml-auto"
                      onClick={() => setShowLogoutConfirm(true)}
                    >
                      <LogOut className="size-4 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <ConfirmModal
        open={showLogoutConfirm}
        title={t("admin.logoutTitle")}
        description={t("admin.logoutDescription")}
        confirmText={t("common.logout")}
        variant="primary"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
      />
    </Sidebar>
  );
}
