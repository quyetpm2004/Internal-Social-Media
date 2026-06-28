import { useEffect, useState } from "react";
import { searchApi } from "@/features/search/api/search.api";
import type { SearchUser } from "@/features/search/types/search.type";
import {
  buildMentionAutocompleteUsers,
  filterLocalMentionCandidates,
  type MentionUser,
} from "@/features/mention/utils/mention";

type UseMentionSearchOptions = {
  candidates?: MentionUser[];
  excludeUserId?: number;
  allowMentionAll?: boolean;
};

const toSearchUser = (user: MentionUser): SearchUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email ?? "",
  avatarUrl: user.avatarUrl ?? null,
  departmentName: null,
  positionName: null,
});

export const useMentionSearch = (
  query: string | null,
  enabled = true,
  options: UseMentionSearchOptions = {},
) => {
  const { candidates, excludeUserId, allowMentionAll = false } = options;
  const isLocal = candidates != null;
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || query == null) {
      setUsers([]);
      setLoading(false);
      return;
    }

    if (isLocal) {
      const filtered = filterLocalMentionCandidates(
        candidates,
        query,
        excludeUserId,
      );
      const withAll = buildMentionAutocompleteUsers(filtered, {
        query,
        allowMentionAll,
      });
      setUsers(withAll.map(toSearchUser));
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setUsers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchApi.search(trimmed, "people", 1, 8);
        if (!cancelled) {
          const withAll = buildMentionAutocompleteUsers(res.data.users ?? [], {
            query: trimmed,
            allowMentionAll,
          });
          setUsers(withAll.map(toSearchUser));
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [allowMentionAll, candidates, enabled, excludeUserId, isLocal, query]);

  return { users, loading };
};
