import type { RightSidebarWidgetProps } from "@/features/new-feed/types/new-feed.type";

const RightSidebarWidget: React.FC<RightSidebarWidgetProps> = ({
  title,
  icon: Icon,
  children,
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
    <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
      <Icon size={18} className="text-blue-700" />
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </div>
);

export default RightSidebarWidget;
