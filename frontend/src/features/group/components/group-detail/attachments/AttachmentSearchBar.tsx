import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

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
  const [inputValue, setInputValue] = useState(searchTerm);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchChange(inputValue.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative max-w-md">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-blue-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Search size={18} />
        </button>
      </div>
    </form>
  );
};
