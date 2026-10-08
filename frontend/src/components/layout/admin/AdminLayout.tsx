import { Outlet } from "react-router-dom";
import AdminHeader from "@/components/layout/admin/AdminHeader";
import AdminSidebar from "@/components/layout/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#f3f7ff]">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(165deg,#e7f2ff_0%,#f6f3ff_42%,#eefbf6_100%)]">
            <AdminHeader />
            <main className="flex-1 overflow-auto">
              <div className="mx-auto max-w-6xl p-6">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
