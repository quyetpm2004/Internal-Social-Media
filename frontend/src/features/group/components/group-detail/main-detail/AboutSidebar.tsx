import React from "react";
import { Building2, Calendar, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

type AboutSidebarProps = {
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
    <aside className="lg:sticky lg:top-20">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50">
            <Info size={15} />
          </span>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t("common.description")}
          </h3>
        </div>

        <div className="space-y-4 p-4">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description || t("pages.groups.noDescription")}
          </p>

          <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            {establishedDate && (
              <SidebarInfo
                icon={<Calendar size={16} />}
                label={t("pages.groups.established")}
                value={establishedDate}
              />
            )}
            {department && (
              <SidebarInfo
                icon={<Building2 size={16} />}
                label={t("common.department")}
                value={department}
              />
            )}
          </div>
        </div>
      </section>
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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  </div>
);

export default AboutSidebar;
