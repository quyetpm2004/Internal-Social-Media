import { Outlet } from "react-router-dom";
import type { CSSProperties } from "react";
import AppHeader from "@/components/layout/user/AppHeader";
import AppSidebar from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function MainLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider style={{ "--sidebar-width": "20rem" } as CSSProperties}>
        <div className="min-h-screen bg-background w-full">
          <AppHeader />
          <div className="flex pt-16">
            <AppSidebar />
            <div className="flex-1 w-full min-w-0 mx-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
