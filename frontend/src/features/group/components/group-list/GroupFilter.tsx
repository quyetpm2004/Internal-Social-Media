import { useTranslation } from "react-i18next";
import {
  FilterPills,
  SearchField,
  searchButtonClass,
} from "@/components/shared/SearchFilter";

type GroupFilterProps = {
  filter: string;
  setFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  resultCount?: number;
};

const filters = [
  { value: "", labelKey: "pages.groups.filterAll" },
  { value: "MY", labelKey: "pages.groups.filterMy" },
  { value: "PUBLIC", labelKey: "common.public" },
  { value: "PRIVATE", labelKey: "common.private" },
  { value: "DEPARTMENT", labelKey: "common.department" },
] as const;

const GroupFilter = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  onSearch,
  resultCount,
}: GroupFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 gap-2">
          <SearchField
            placeholder={t("pages.groups.searchGroupsPlaceholder")}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
          <button
            type="button"
            onClick={onSearch}
            className={`${searchButtonClass} rounded-lg`}
          >
            {t("common.search")}
          </button>
        </div>

        <FilterPills
          options={filters.map((item) => ({
            value: item.value,
            label: t(item.labelKey),
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {typeof resultCount === "number" && (
        <p className="mt-3 px-1 text-xs text-slate-500">
          {t("pages.groups.resultCount", { count: resultCount })}
        </p>
      )}
    </div>
  );
};

export default GroupFilter;
