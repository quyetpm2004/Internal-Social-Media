import React from "react";

export interface InfoFieldProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}

const InfoField: React.FC<InfoFieldProps> = ({ label, value, icon }) => (
  <div className="space-y-2 flex-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </label>
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-slate-900 dark:text-slate-100 font-medium flex items-center gap-3">
      {icon}
      <div className="truncate">{value}</div>
    </div>
  </div>
);

export default InfoField;
