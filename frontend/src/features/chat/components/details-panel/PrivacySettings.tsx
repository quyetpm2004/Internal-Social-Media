import { useTranslation } from "react-i18next";

interface PrivacySettingsProps {
  muteNotifications: boolean;
  submitting?: boolean;
  onToggleMute: () => void;
  onBlockContact?: () => void;
}

const PrivacySettings = ({
  // muteNotifications,
  // submitting,
  // onToggleMute,
  onBlockContact,
}: PrivacySettingsProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-on-surface">
        {t("pages.chat.privacySettings")}
      </h4>

      <div className="space-y-1">
        <button
          type="button"
          onClick={onBlockContact}
          className="w-full text-left px-3 py-2 text-sm font-medium text-error hover:bg-error-container/20 rounded-lg transition-all cursor-pointer"
        >
          {t("pages.chat.blockContact")}
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;
