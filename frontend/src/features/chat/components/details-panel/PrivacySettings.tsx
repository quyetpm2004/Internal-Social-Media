import { ToggleLeft, ToggleRight } from "lucide-react";

interface PrivacySettingsProps {
  muteNotifications: boolean;
  submitting?: boolean;
  onToggleMute: () => void;
  onBlockContact?: () => void;
}

const PrivacySettings = ({
  muteNotifications,
  submitting,
  onToggleMute,
  onBlockContact,
}: PrivacySettingsProps) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-on-surface">
        Quyền riêng tư &amp; cài đặt
      </h4>

      <div className="space-y-1">
        <button
          type="button"
          onClick={onToggleMute}
          disabled={submitting}
          className="w-full text-left px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high rounded-lg flex items-center justify-between group transition-all cursor-pointer disabled:opacity-60"
        >
          <span>Tắt thông báo</span>
          {muteNotifications ? (
            <ToggleRight size={24} className="text-primary" />
          ) : (
            <ToggleLeft size={24} className="text-on-surface-variant" />
          )}
        </button>

        <button
          type="button"
          onClick={onBlockContact}
          className="w-full text-left px-3 py-2 text-sm font-medium text-error hover:bg-error-container/20 rounded-lg transition-all cursor-pointer"
        >
          Chặn liên lạc
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;
