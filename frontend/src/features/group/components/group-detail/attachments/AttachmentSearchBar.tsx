import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  SearchField,
  SearchFilter,
  searchButtonClass,
} from "@/components/shared/SearchFilter";

type AttachmentSearchBarProps = {
  placeholder: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export const AttachmentSearchBar = ({
  placeholder,
  searchTerm,
  onSearchChange,
}: AttachmentSearchBarProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(searchTerm);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchChange(inputValue.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <SearchFilter className="mb-6">
        <SearchField
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" className={`${searchButtonClass} rounded-lg`}>
          {t("common.search")}
        </button>
      </SearchFilter>
    </form>
  );
};
