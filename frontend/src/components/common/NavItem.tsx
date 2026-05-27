import React from "react";

interface NavItemProps {
  icon: React.ReactNode | string;
  label: string;
  active?: boolean;
  path: string;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active = false,
  path,
}) => (
  <a
    href={path}
    className={`flex items-center gap-3 px-3 py-3 transition-all rounded-lg font-medium text-sm ${
      active
        ? "bg-white dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-semibold"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
    }`}
  >
    {icon}
    {label}
  </a>
);

export default NavItem;
