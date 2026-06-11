import { Outlet } from "react-router-dom";
import AppHeader from "@/components/layout/user/AppHeader";
import AppSidebar from "./AppSidebar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex pt-16">
        <AppSidebar />
        <main className="flex-1 md:ml-80 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
