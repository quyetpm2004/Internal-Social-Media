import { Bell, LogOut, Mail, Search, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function AppHeader() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md fixed top-0 w-full z-50">
      <div className="flex items-center justify-between px-6 h-16 w-full max-w-360 mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-xl font-extrabold text-blue-900 dark:text-white tracking-tight">
            CollabNet
          </span>
          <div className="hidden md:flex items-center bg-surface-container-highest px-4 py-2 rounded-lg gap-3 w-100">
            <Search size={20} />
            <input
              className="bg-transparent focus:ring-0 text-sm w-full placeholder-on-surface-variant border-none focus-visible:outline-none px-4 py-1"
              placeholder="Tìm kiếm..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Bell size={20} />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Mail size={20} />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200">
            <Settings size={20} />
          </button>
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-200 ml-2">
            <img
              alt="User profile"
              className="h-full w-full object-cover"
              data-alt="professional headshot of a smiling architect in a modern office setting with soft natural light"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9s_JOLsb7FM_GUhjrljEmXubbaGwgRs1kQHYUvHK1bQfTOcJWIwBj6VT-SSm7aUmuWLr3KGbRzwSRFLxhLSnL5-m0n_ifuEWji3kS5AXwsanL_zTWO7U-B8zGs0Q7x3EK6M_I4AGGU81-tihY5pFnqlA7swpLkCT4s53-40PN0N0eg0vGf5hcyoviLkmkDxxhbi1hraoKoPQX53b3WR2nI3LkwGK504m6IYr2NXhJOqDi1PC6A2UYPXTmOS0mcs-NJp8yCw8VzpY"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
