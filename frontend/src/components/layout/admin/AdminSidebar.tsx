import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
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

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/posts", label: "Bài viết", icon: FileText },
  { to: "/admin/groups", label: "Nhóm", icon: UsersRound },
];

export default function AdminSidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
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
            <span className="text-sm font-semibold">Admin Panel</span>
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
                    <button className="ml-auto" onClick={() => logout()}>
                      <LogOut className="size-4 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
