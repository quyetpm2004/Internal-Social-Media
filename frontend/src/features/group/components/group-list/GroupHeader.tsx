import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

type GroupHeaderProps = {
  onClick: () => void;
};

const GroupHeader = ({ onClick }: GroupHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("pages.groups.title")}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          {t("pages.groups.description")}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        onClick={onClick}
      >
        <Plus size={16} />
        {t("pages.groups.createGroup")}
      </button>
    </div>
  );
};

export default GroupHeader;
