import { MessageSquareText } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChatEmptyPage = () => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-1 flex-col items-center justify-center bg-slate-50/70 px-6 text-center dark:bg-slate-950/30">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40">
        <MessageSquareText size={26} />
      </div>

      <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t("pages.chat.emptyTitle")}
      </h2>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {t("pages.chat.emptyDescription")}
      </p>
    </section>
  );
};

export default ChatEmptyPage;
