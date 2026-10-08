import { Layers } from "lucide-react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const spaces = {
  personal: {
    titleKey: "personalTitle",
    subtitleKey: "personalSubtitle",
    members: 1,
    items: [
      { vi: "Ghi chú việc cá nhân trong tuần", en: "Personal notes for the week" },
      { vi: "Chuẩn bị nội dung báo cáo thứ sáu", en: "Prepare the Friday report" },
    ],
  },
  sales: {
    titleKey: "salesTitle",
    subtitleKey: "salesSubtitle",
    members: 8,
    items: [
      { vi: "Theo dõi đề xuất CollabNet cho khách mới", en: "Track the CollabNet proposal for a new client" },
      { vi: "Cập nhật pipeline tuần này", en: "Update this week's pipeline" },
    ],
  },
  engineering: {
    titleKey: "engineeringTitle",
    subtitleKey: "engineeringSubtitle",
    members: 12,
    items: [
      { vi: "Rà sprint CollabNet Mobile", en: "Review the CollabNet Mobile sprint" },
      { vi: "Chia task còn thiếu người nhận", en: "Assign the tasks that still have no owner" },
    ],
  },
} as const;

export default function WorkSpacePage() {
  const { spaceId } = useParams();
  const { t, i18n } = useTranslation();
  const space = spaces[spaceId as keyof typeof spaces];

  if (!space) {
    return (
      <main className="px-6 py-16 text-center text-sm text-slate-500">
        {t("pages.workSpace.unknown")}
      </main>
    );
  }

  return (
    <main className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Layers className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t(`pages.workSpace.${space.titleKey}`)}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {t(`pages.workSpace.${space.subtitleKey}`)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t("pages.workSpace.members", { count: space.members })}
          </p>
        </div>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <ul className="divide-y divide-slate-100">
          {space.items.map((item) => (
            <li key={item.vi} className="py-3 text-sm text-slate-700">
              {i18n.language.startsWith("en") ? item.en : item.vi}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
