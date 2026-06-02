import { Search } from "lucide-react";

interface ConversationSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFocus: () => void;
}

const ConversationSearch = ({
  searchQuery,
  setSearchQuery,
  onFocus,
}: ConversationSearchProps) => {
  return (
    <div className="relative flex-1">
      <button
        //   onClick={onSearch}
        className="
              absolute left-3 top-1/2 -translate-y-1/2
              flex items-center gap-1
              text-primary
              text-sm font-medium
              hover:opacity-90
              transition
              cursor-pointer
            "
      >
        <Search size={18} />
      </button>

      <input
        className="
              w-full
              pl-10
              py-2
              bg-surface-container-highest
              border-none
              outline-none
              rounded-2xl
              text-sm
              focus:ring-2
              focus:ring-surface-tint
              transition-all
            "
        placeholder="Tìm kiếm đoạn chat"
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={onFocus}
      />
    </div>
  );
};

export default ConversationSearch;
