import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useMessenger } from "@/features/chat/context/MessengerContext";
import MessengerDropdown from "./MessengerDropdown";
import { useTranslation } from "react-i18next";

const MessengerBell = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    dropdownOpen,
    setDropdownOpen,
    totalUnreadCount,
    refreshConversations,
  } = useMessenger();

  useEffect(() => {
    if (!dropdownOpen) return;

    refreshConversations();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(target as Element).closest?.("[data-messenger-dock]")
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, refreshConversations, setDropdownOpen]);

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`relative p-2 rounded-full transition-colors active:scale-95 duration-200 ${
          dropdownOpen
            ? "bg-[#e7f3ff] dark:bg-[#263951] text-[#0866ff]"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        aria-label={t("nav.messages")}
      >
        <MessageCircle size={20} />
        {totalUnreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && <MessengerDropdown />}
    </div>
  );
};

export const MessengerBellMobile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { totalUnreadCount } = useMessenger();

  return (
    <button
      type="button"
      onClick={() => navigate("/messages")}
      className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200 md:hidden"
      aria-label={t("nav.messages")}
    >
      <MessageCircle size={20} />
      {totalUnreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
          {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
        </span>
      )}
    </button>
  );
};

export default MessengerBell;
