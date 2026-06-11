import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/layout/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background w-full">
          <AdminSidebar />
          <main className="flex-1 overflow-auto p-6 max-w-6xl mx-auto">
            <SidebarTrigger className="hidden md:block" />
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
