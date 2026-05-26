import { ListFilter, Search } from "lucide-react";

type GroupFilterProps = {
  filter: string;
  setFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
};

const GroupFilter = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  onSearch,
}: GroupFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="flex items-center gap-2 w-full sm:max-w-md">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <ListFilter size={18} />
          </span>

          <button
            onClick={onSearch}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              flex items-center gap-1
              px-3 py-1.5
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
              pr-28
              py-3
              bg-surface-container-highest
              border-none
              outline-none
              rounded-2xl
              text-sm
              focus:ring-2
              focus:ring-surface-tint
              transition-all
            "
            placeholder="Tìm kiếm nhóm..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch();
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
        <button
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
            filter === ""
              ? "bg-primary-container text-white"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
          onClick={() => setFilter("")}
        >
          Tất cả
        </button>

        <button
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
            filter === "MY"
              ? "bg-primary-container text-white"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
          onClick={() => setFilter("MY")}
        >
          Nhóm của bạn
        </button>

        <button
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
            filter === "PUBLIC"
              ? "bg-primary-container text-white"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
          onClick={() => setFilter("PUBLIC")}
        >
          Công khai
        </button>

        <button
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
            filter === "PRIVATE"
              ? "bg-primary-container text-white"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
          onClick={() => setFilter("PRIVATE")}
        >
          Riêng tư
        </button>

        <button
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
            filter === "DEPARTMENT"
              ? "bg-primary-container text-white"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
          onClick={() => setFilter("DEPARTMENT")}
        >
          Phòng ban
        </button>
      </div>
    </div>
  );
};

export default GroupFilter;
