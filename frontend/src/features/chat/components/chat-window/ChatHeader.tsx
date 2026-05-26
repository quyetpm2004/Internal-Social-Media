import { ArrowLeft, Info, Phone, Users, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "@/features/chat/types/chat.type";

interface ChatHeaderProps {
  conversation: Conversation;
  onToggleDetails?: () => void;
}

const ChatHeader = ({ conversation, onToggleDetails }: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { type, name, avatarUrl, memberCount } = conversation;

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-surface-container-lowest border-b border-outline-variant/10 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate("/messages")}
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-90 cursor-pointer md:hidden"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-secondary-container flex items-center justify-center">
          {type === "GROUP" || !avatarUrl ? (
            <Users size={18} className="text-on-secondary-container" />
          ) : (
            <img
              alt={name}
              className="w-full h-full object-cover"
              src={avatarUrl}
            />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-md font-bold text-on-surface leading-tight font-headline truncate">
            {name}
          </h3>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant tracking-wide font-label uppercase">
              {type === "GROUP"
                ? `${memberCount} thành viên`
                : "Tin nhắn trực tiếp"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-90 cursor-pointer"
          aria-label="Gọi thoại"
        >
          <Phone size={20} />
        </button>

        <button
          type="button"
          className="p-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-90 cursor-pointer"
          aria-label="Gọi video"
        >
          <Video size={20} />
        </button>

        <button
          type="button"
          onClick={onToggleDetails}
          className="p-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-90 cursor-pointer"
          aria-label="Thông tin"
        >
          <Info size={20} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
