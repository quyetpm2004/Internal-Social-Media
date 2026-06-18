import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

type GroupHeaderProps = {
  onClick: () => void;
};

const GroupHeader = ({ onClick }: GroupHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
          {t("pages.groups.title")}
        </h1>
        <p className="text-on-surface-variant text-sm">
          {t("pages.groups.description")}
        </p>
      </div>
      <button
        className="inline-flex items-center cursor-pointer gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-primary/20"
        onClick={onClick}
      >
        <Users size={16} />
        {t("pages.groups.createGroup")}
      </button>
    </div>
  );
};

export default GroupHeader;
