import { Users } from "lucide-react";
import type { ConversationDetail } from "@/features/chat/types/chat.type";

interface ProfileSummaryProps {
  conversation: ConversationDetail;
}

const ProfileSummary = ({ conversation }: ProfileSummaryProps) => {
  const { type, name, avatarUrl, counterpart, memberCount } = conversation;

  return (
    <div className="p-8 flex flex-col items-center text-center space-y-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl border-4 border-surface-container-lowest transform rotate-2 bg-secondary-container flex items-center justify-center">
          {type === "GROUP" || !avatarUrl ? (
            <Users size={48} className="text-on-secondary-container" />
          ) : (
            <img
              alt={name}
              className="w-full h-full object-cover"
              src={avatarUrl}
            />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-headline font-extrabold text-on-surface">
          {name}
        </h2>
      </div>
    </div>
  );
};

export default ProfileSummary;
