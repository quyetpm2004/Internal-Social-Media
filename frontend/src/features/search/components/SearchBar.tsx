import { useEffect, useRef, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { searchApi } from "@/features/search/api/search.api";
import type { SearchHistoryItem } from "@/features/search/types/search.type";
import UserSearchResultItem from "@/features/search/components/UserSearchResultItem";
import GroupSearchResultItem from "@/features/search/components/GroupSearchResultItem";
import type { SearchGroup, SearchUser } from "@/features/search/types/search.type";
import { useTranslation } from "react-i18next";

export default function SearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [histories, setHistories] = useState<SearchHistoryItem[]>([]);
  const [previewUsers, setPreviewUsers] = useState<SearchUser[]>([]);
  const [previewGroups, setPreviewGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmedQuery = query.trim();

  const fetchHistory = async () => {
    try {
      const res = await searchApi.getHistory(8);
      setHistories(res.data);
    } catch {
      setHistories([]);
    }
  };

  const fetchPreview = async (q: string) => {
    if (!q) {
      setPreviewUsers([]);
      setPreviewGroups([]);
      return;
    }

    try {
      setLoading(true);
      const res = await searchApi.search(q, "all", 1, 5);
      setPreviewUsers(res.data.users);
      setPreviewGroups(res.data.groups);
    } catch {
      setPreviewUsers([]);
      setPreviewGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (trimmedQuery) {
        fetchPreview(trimmedQuery);
      } else {
        setPreviewUsers([]);
        setPreviewGroups([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [trimmedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToSearchPage = async (q: string) => {
    const keyword = q.trim();
    if (!keyword) return;

    try {
      await searchApi.saveHistory(keyword);
    } catch {
      /* ignore */
    }

    setIsOpen(false);
    const tab = searchParams.get("tab");
    const tabParam = tab ? `&tab=${tab}` : "";
    navigate(`/search?q=${encodeURIComponent(keyword)}${tabParam}`);
  };

  const handleClearQuery = () => {
    setQuery("");
    if (location.pathname === "/search") {
      navigate("/search");
    }
  };

  const handleDeleteHistory = async (
    e: React.MouseEvent,
    historyId: number,
  ) => {
    e.stopPropagation();
    try {
      await searchApi.deleteHistoryItem(historyId);
      setHistories((prev) => prev.filter((h) => h.id !== historyId));
    } catch {
      /* ignore */
    }
  };

  const handleClearHistory = async () => {
    try {
      await searchApi.clearHistory();
      setHistories([]);
    } catch {
      /* ignore */
    }
  };

  const showHistory = isOpen && !trimmedQuery && histories.length > 0;
  const showPreview =
    isOpen && trimmedQuery && (previewUsers.length > 0 || previewGroups.length > 0);
  const showDropdown = isOpen && (showHistory || showPreview || loading);

  return (
    <div ref={containerRef} className="relative hidden md:block w-full">
      <div
        className={`flex items-center bg-surface-container-highest px-3 py-2 w-full rounded-full gap-2 transition-shadow ${
          isOpen ? "ring-2 ring-blue-500/30 shadow-sm" : ""
        }`}
      >
        <Search size={18} className="text-slate-500 shrink-0" />

        <input
          className="bg-transparent focus:ring-0 text-sm w-full placeholder-on-surface-variant border-none focus-visible:outline-none py-0.5"
          placeholder={t("pages.search.searchPlaceholder")}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              goToSearchPage(query);
            }
          }}
        />

        {query && (
          <button
            type="button"
            onClick={handleClearQuery}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {showHistory && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("pages.search.recentSearch")}
                </span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {t("common.clearAll")}
                </button>
              </div>

              {histories.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToSearchPage(item.query)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToSearchPage(item.query);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                >
                  <Clock size={18} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-left text-sm text-slate-800 dark:text-slate-200 truncate">
                    {item.query}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistory(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
                    aria-label={t("common.delete")}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {loading && trimmedQuery && (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">
              {t("pages.search.searching")}
            </p>
          )}

          {showPreview && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800">
              {previewUsers.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("pages.search.people")}
                  </p>
                  {previewUsers.map((user) => (
                    <UserSearchResultItem
                      key={user.id}
                      user={user}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}

              {previewGroups.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("pages.search.groups")}
                  </p>
                  {previewGroups.map((group) => (
                    <GroupSearchResultItem
                      key={group.id}
                      group={group}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => goToSearchPage(query)}
                className="w-full mt-1 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors text-left"
              >
                {t("pages.search.viewAllResults", { query: trimmedQuery })}
              </button>
            </div>
          )}

          {!loading && trimmedQuery && !showPreview && (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">
              {t("pages.search.noQuickResult")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
