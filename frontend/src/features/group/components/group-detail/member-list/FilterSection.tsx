import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  FilterPills,
  SearchField,
  searchButtonClass,
} from "@/components/shared/SearchFilter";
import {
  MEMBER_ROLE_FILTER_OPTIONS,
  type MemberRoleFilter,
} from "@/features/group/utils/group-member";

interface FilterSectionProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  activeRole: MemberRoleFilter | null;
  onRoleChange: (role: MemberRoleFilter | null) => void;
}

export const FilterSection = ({
  searchTerm,
  onSearchChange,
  activeRole,
  onRoleChange,
}: FilterSectionProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(searchTerm);

  const handleRoleClick = (role: MemberRoleFilter) => {
    onRoleChange(activeRole === role ? null : role);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchChange(inputValue);
  };

  return (
    <div className="mb-8 flex flex-col items-center gap-4 md:flex-row">
      <form
        onSubmit={handleSubmit}
        className="flex w-full gap-2 sm:max-w-md"
      >
        <SearchField
          type="text"
          placeholder={t("pages.groups.searchMembersPlaceholder")}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className={`${searchButtonClass} rounded-lg`}>
          {t("common.search")}
        </button>
      </form>

      <FilterPills
        options={MEMBER_ROLE_FILTER_OPTIONS}
        value={activeRole ?? ""}
        onChange={(value) => handleRoleClick(value as MemberRoleFilter)}
      />
    </div>
  );
};
