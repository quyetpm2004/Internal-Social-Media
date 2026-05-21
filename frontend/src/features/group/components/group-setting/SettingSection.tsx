import React from "react";

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
    <div className="p-4 border-b border-gray-100">
      <div className="text-xl font-semibold text-gray-900">{title}</div>
    </div>
    <div className="flex-1 divide-y divide-gray-50">{children}</div>
  </div>
);

export default SettingSection;
