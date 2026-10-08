import type { RightSidebarWidgetProps } from "@/features/new-feed/types/post.type";

const RightSidebarWidget: React.FC<RightSidebarWidgetProps> = ({
  title,
  icon: Icon,
  action,
  children,
}) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
      <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50">
          <Icon size={15} />
        </span>
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>
    <div className="p-2">{children}</div>
  </section>
);

export default RightSidebarWidget;
