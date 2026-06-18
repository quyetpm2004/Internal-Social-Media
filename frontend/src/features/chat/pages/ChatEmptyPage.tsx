import { MessageSquareText } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChatEmptyPage = () => {
  const { t } = useTranslation();

  return (
    <section className="flex-1 flex flex-col bg-surface-container-lowest items-center justify-center text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
        <MessageSquareText size={36} />
      </div>

      <h2 className="text-2xl font-headline font-extrabold text-on-surface">
        {t("pages.chat.emptyTitle")}
      </h2>

      <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
        {t("pages.chat.emptyDescription")}
      </p>
    </section>
  );
};

export default ChatEmptyPage;
