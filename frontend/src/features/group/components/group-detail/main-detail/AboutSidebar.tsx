import React from "react";
import { Calendar, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type AboutSidebarProps = {
  // You can add props here if needed, e.g. group details
  description?: string;
  establishedDate?: string;
  department?: string;
};

const AboutSidebar: React.FC<AboutSidebarProps> = ({
  description,
  establishedDate,
  department,
}) => {
  const { t } = useTranslation();
  return (
    <aside className="md:col-span-4 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">{t("common.description")}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
          {description}
        </p>

        <div className="space-y-4">
          <SidebarInfo
            icon={<Calendar size={18} />}
            label={t("pages.groups.established")}
            value={establishedDate || ""}
          />
          {department && (
            <SidebarInfo
              icon={<Building2 size={18} />}
              label={t("common.department")}
              value={department || ""}
            />
          )}
        </div>
      </div>
    </aside>
  );
};

const SidebarInfo = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="text-slate-400">{icon}</div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  </div>
);

export default AboutSidebar;
