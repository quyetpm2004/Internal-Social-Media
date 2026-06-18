import { Users, UserPlus } from "lucide-react";
import type { ConversationDetail } from "@/features/chat/types/chat.type";
import GroupAvatarMenu from "./GroupAvatarMenu";
import { useTranslation } from "react-i18next";

interface ProfileSummaryProps {
  conversation: ConversationDetail;
  currentUserId: number;
  onConversationUpdated: (conversation: ConversationDetail) => void;
  onCreateGroup?: () => void;
}

const ProfileSummary = ({
  conversation,
  currentUserId,
  onConversationUpdated,
  onCreateGroup,
}: ProfileSummaryProps) => {
  const { t } = useTranslation();
  const { type, name, avatarUrl, counterpart, memberCount } = conversation;

  const isGroup = type === "GROUP";
  const myMember = conversation.members.find((m) => m.user.id === currentUserId);
  const isAdmin = myMember?.role === "ADMIN";

  return (
    <div className="p-8 flex flex-col items-center text-center space-y-4">
      {isGroup ? (
        <GroupAvatarMenu
          conversation={conversation}
          isAdmin={isAdmin}
          onUpdated={onConversationUpdated}
        />
      ) : (
        <div className="relative">
          <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl border-4 border-surface-container-lowest transform rotate-2 bg-secondary-container flex items-center justify-center">
            {avatarUrl ? (
              <img
                alt={name}
                className="w-full h-full object-cover"
                src={avatarUrl}
              />
            ) : (
              <Users size={48} className="text-on-secondary-container" />
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xl font-headline font-extrabold text-on-surface">
          {name}
        </h2>
        {isGroup && memberCount > 0 && (
          <p className="text-sm text-on-surface-variant">
            {memberCount} {t("pages.groups.members")}
          </p>
        )}
        {!isGroup && counterpart && (
          <p className="text-sm text-on-surface-variant truncate max-w-full px-2">
            {counterpart.fullName}
          </p>
        )}
      </div>

      {!isGroup && counterpart && onCreateGroup && (
        <button
          type="button"
          onClick={onCreateGroup}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
        >
          <UserPlus size={18} />
          {t("pages.chat.createGroup")}
        </button>
      )}
    </div>
  );
};

export default ProfileSummary;
