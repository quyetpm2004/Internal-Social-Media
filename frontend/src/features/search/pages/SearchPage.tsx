import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Users, Landmark, X } from "lucide-react";
import { searchApi } from "@/features/search/api/search.api";
import UserSearchResultItem from "@/features/search/components/UserSearchResultItem";
import GroupSearchResultItem from "@/features/search/components/GroupSearchResultItem";
import type {
  SearchGroup,
  SearchTab,
  SearchUser,
} from "@/features/search/types/search.type";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const TABS: { id: SearchTab; label: string; icon: typeof Search }[] = [
    { id: "all", label: t("pages.search.tabAll"), icon: Search },
    { id: "people", label: t("pages.search.people"), icon: Users },
    { id: "groups", label: t("pages.search.groups"), icon: Landmark },
  ];

  const initialQuery = searchParams.get("q") ?? "";
  const initialTab = (searchParams.get("tab") as SearchTab) || "all";

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [counts, setCounts] = useState<{
    users: number;
    groups: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const trimmedQuery = query.trim();

  const goToSearchPage = async (q: string) => {
    const keyword = q.trim();
    if (!keyword) return;

    try {
      await searchApi.saveHistory(keyword);
    } catch {
      /* ignore */
    }

    const tab = searchParams.get("tab");
    const tabParam = tab ? `&tab=${tab}` : "";
    navigate(`/search?q=${encodeURIComponent(keyword)}${tabParam}`);
  };

  const performSearch = useCallback(
    async (q: string, tab: SearchTab, pageNum = 1, append = false) => {
      if (!q) {
        setUsers([]);
        setGroups([]);
        setCounts(null);
        setHasMore(false);
        return;
      }

      try {
        setLoading(true);
        const res = await searchApi.search(q, tab, pageNum, 10);

        if (tab === "all") {
          setUsers(res.data.users);
          setGroups(res.data.groups);
          setCounts(res.data.counts);
          setHasMore(false);
        } else if (tab === "people") {
          setUsers((prev) =>
            append ? [...prev, ...res.data.users] : res.data.users,
          );
          setGroups([]);
          setCounts(null);
          setHasMore(res.data.pagination?.hasNextPage ?? false);
        } else {
          setGroups((prev) =>
            append ? [...prev, ...res.data.groups] : res.data.groups,
          );
          setUsers([]);
          setCounts(null);
          setHasMore(res.data.pagination?.hasNextPage ?? false);
        }
      } catch {
        if (!append) {
          setUsers([]);
          setGroups([]);
          setCounts(null);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const tab = (searchParams.get("tab") as SearchTab) || "all";
    setQuery(q);
    setActiveTab(tab);
    setPage(1);
    performSearch(q, tab, 1);
  }, [searchParams, performSearch]);

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setPage(1);
    const q = trimmedQuery;
    if (q) {
      setSearchParams({ q, tab });
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(trimmedQuery, activeTab, nextPage, true);
  };

  const totalPeople = counts?.users ?? users.length;
  const totalGroups = counts?.groups ?? groups.length;

  const handleClearQuery = () => {
    setInputValue("");
    if (location.pathname === "/search") {
      navigate("/search");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center bg-surface-container-highest px-3 py-2 w-full rounded-full gap-2 transition-shadow ring-2 ring-blue-500/30 shadow-sm md:hidden mb-2">
        <Search size={18} className="text-slate-500 shrink-0" />

        <input
          className="bg-transparent focus:ring-0 text-sm w-full placeholder-on-surface-variant border-none focus-visible:outline-none py-0.5"
          placeholder={t("pages.search.searchPlaceholder")}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const keyword = inputValue.trim();

              if (!keyword) return;

              setQuery(keyword);
              goToSearchPage(keyword);
            }
          }}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClearQuery}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="mb-4">
        {trimmedQuery && (
          <>
            <h1 className="font-headline text-display-sm md:text-headline-lg font-extrabold tracking-tight text-on-surface mb-2">
              {t("pages.search.resultFor", { query })}
            </h1>
          </>
        )}
      </div>

      {trimmedQuery && (
        <>
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {loading && users.length === 0 && groups.length === 0 ? (
            <p className="text-center text-slate-500 py-12">
              {t("pages.search.searching")}
            </p>
          ) : (
            <>
              {(activeTab === "all" || activeTab === "people") &&
                users.length > 0 && (
                  <section className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-base font-semibold text-slate-900 dark:text-white">
                        {t("pages.search.people")}
                      </div>
                      {activeTab === "all" && totalPeople > users.length && (
                        <Link
                          to={`/search?q=${encodeURIComponent(trimmedQuery)}&tab=people`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {t("common.viewAll")} ({totalPeople})
                        </Link>
                      )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                      {users.map((user) => (
                        <UserSearchResultItem key={user.id} user={user} />
                      ))}
                    </div>
                  </section>
                )}

              {(activeTab === "all" || activeTab === "groups") &&
                groups.length > 0 && (
                  <section className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-base font-semibold text-slate-900 dark:text-white">
                        {t("pages.search.groups")}
                      </div>
                      {activeTab === "all" && totalGroups > groups.length && (
                        <Link
                          to={`/search?q=${encodeURIComponent(trimmedQuery)}&tab=groups`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {t("common.viewAll")} ({totalGroups})
                        </Link>
                      )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                      {groups.map((group) => (
                        <GroupSearchResultItem key={group.id} group={group} />
                      ))}
                    </div>
                  </section>
                )}

              {!loading && users.length === 0 && groups.length === 0 && (
                <div className="text-center py-16">
                  <Search
                    size={48}
                    className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                  />
                  <p className="text-slate-600 dark:text-slate-400">
                    {t("pages.search.noResultFor", { query: trimmedQuery })}
                  </p>
                </div>
              )}

              {hasMore && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    {loading ? t("common.loading") : t("common.viewMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!trimmedQuery && (
        <div className="text-center text-sm py-16 text-slate-500">
          {t("pages.search.emptyHint")}
        </div>
      )}
    </div>
  );
}
