import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import WorkHeader from "@/components/layout/work/WorkHeader";
import WorkSidebar from "@/components/layout/work/WorkSidebar";

export default function WorkLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-svh bg-[#f4f6fb]">
      <div className="md:hidden">
        <WorkHeader onOpenMenu={() => setMenuOpen(true)} />
      </div>
      <div className="flex">
        <WorkSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
