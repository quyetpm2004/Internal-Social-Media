import { ArrowLeft, Info, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "@/features/chat/types/chat.type";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ChatHeaderProps {
  conversation: Conversation;
  isOnline?: boolean;
  onToggleDetails?: () => void;
}

const ChatHeader = ({
  conversation,
  isOnline,
  onToggleDetails,
}: ChatHeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type, name, avatarUrl, memberCount } = conversation;
  const avatarUrlCounterPart = conversation.counterpart?.avatarUrl;

  const statusLabel = (() => {
    if (type === "GROUP") {
      return `${memberCount} ${t("common.members")}${isOnline ? ` · ${t("pages.chat.someoneOnline")}` : ""}`;
    }
    return isOnline ? t("common.active") : t("pages.chat.inactive");
  })();

  return (
    <header className="z-10 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate("/messages")}
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all active:scale-90 cursor-pointer md:hidden"
          aria-label={t("common.back")}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary-container flex items-center justify-center">
            {type === "GROUP" ? (
              avatarUrl ? (
                <img
                  alt={name}
                  className="w-full h-full object-cover"
                  src={avatarUrl}
                />
              ) : (
                <Users size={18} className="text-on-secondary-container" />
              )
            ) : (
              <img
                alt={name}
                className="w-full h-full object-cover"
                src={
                  avatarUrlCounterPart ||
                  getDefaultAvatarUrl(conversation.counterpart?.fullName)
                }
              />
            )}
          </div>
          {isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-container-lowest"
              aria-label={t("pages.chat.online")}
            />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            {name}
          </h3>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDetails}
          className="cursor-pointer rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={t("common.information")}
        >
          <Info size={20} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
