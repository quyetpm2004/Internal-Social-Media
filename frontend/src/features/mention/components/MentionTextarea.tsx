import { useRef, useState, type KeyboardEvent, type ChangeEvent } from "react";
import MentionAutocomplete from "@/features/mention/components/MentionAutocomplete";
import { useMentionSearch } from "@/features/mention/hooks/useMentionSearch";
import {
  getMentionQueryAtCursor,
  insertMentionAllToken,
  insertMentionToken,
  isMentionAllSearchUser,
  resolveMentionedUserIds,
  syncTrackedMentions,
  textIncludesMentionAll,
  type MentionUser,
  type TrackedMention,
} from "@/features/mention/utils/mention";
import type { SearchUser } from "@/features/search/types/search.type";

type MentionTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onMentionedUserIdsChange?: (ids: number[]) => void;
  mentionCandidates?: MentionUser[];
  excludeMentionUserId?: number;
  allowMentionAll?: boolean;
  onMentionAllChange?: (mentionAll: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  onKeyDown?: (
    event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  onBlur?: () => void;
};

const MentionTextarea = ({
  value,
  onChange,
  onMentionedUserIdsChange,
  mentionCandidates,
  excludeMentionUserId,
  allowMentionAll = true,
  onMentionAllChange,
  placeholder,
  disabled = false,
  autoFocus = false,
  multiline = false,
  rows = 1,
  className = "",
  onKeyDown,
  onBlur,
}: MentionTextareaProps) => {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackedMentions, setTrackedMentions] = useState<TrackedMention[]>([]);
  const { users, loading } = useMentionSearch(
    mentionQuery,
    mentionQuery != null,
    {
      candidates: mentionCandidates,
      excludeUserId: excludeMentionUserId,
      allowMentionAll,
    },
  );

  const notifyMentionState = (text: string, tracked: TrackedMention[]) => {
    const mentionAll = textIncludesMentionAll(text);
    onMentionAllChange?.(mentionAll);
    onMentionedUserIdsChange?.(
      mentionAll ? [] : resolveMentionedUserIds(text, tracked),
    );
  };

  const safeActiveIndex = users.length === 0 ? 0 : activeIndex % users.length;

  const syncMentionQuery = (nextValue: string, cursor: number) => {
    const mentionInfo = getMentionQueryAtCursor(nextValue, cursor);
    setMentionQuery(mentionInfo ? mentionInfo.query : null);
  };

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    const nextTracked = nextValue
      ? syncTrackedMentions(nextValue, trackedMentions)
      : [];

    onChange(nextValue);
    setTrackedMentions(nextTracked);
    notifyMentionState(nextValue, nextTracked);
    syncMentionQuery(
      nextValue,
      event.target.selectionStart ?? nextValue.length,
    );
    setActiveIndex(0);
  };

  const selectMentionAll = () => {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? value.length;
    const { nextText, nextCursor } = insertMentionAllToken(value, cursor);

    onChange(nextText);
    setTrackedMentions([]);
    notifyMentionState(nextText, []);
    setMentionQuery(null);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      if (!input) return;
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const selectUser = (user: SearchUser) => {
    if (isMentionAllSearchUser(user)) {
      selectMentionAll();
      return;
    }

    const input = inputRef.current;
    const cursor = input?.selectionStart ?? value.length;
    const { nextText, nextCursor } = insertMentionToken(value, cursor, user);
    const nextTracked = syncTrackedMentions(nextText, [
      ...trackedMentions,
      { id: user.id, fullName: user.fullName },
    ]);

    onChange(nextText);
    setTrackedMentions(nextTracked);
    notifyMentionState(nextText, nextTracked);
    setMentionQuery(null);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      if (!input) return;
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    if (mentionQuery != null && users.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % users.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + users.length) % users.length);
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        selectUser(users[safeActiveIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    onKeyDown?.(event);
  };

  const sharedProps = {
    ref: inputRef as never,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur,
    onClick: (
      event: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => {
      const target = event.currentTarget;
      syncMentionQuery(
        target.value,
        target.selectionStart ?? target.value.length,
      );
    },
    placeholder,
    disabled,
    autoFocus,
    className,
  };

  return (
    <div className="relative flex-1 min-w-0 flex">
      {multiline ? (
        <textarea {...sharedProps} rows={rows} />
      ) : (
        <input type="text" {...sharedProps} />
      )}

      {mentionQuery != null && (
        <MentionAutocomplete
          users={users}
          loading={loading}
          activeIndex={safeActiveIndex}
          onSelect={selectUser}
          className="left-0 bottom-full mb-1"
        />
      )}
    </div>
  );
};

export default MentionTextarea;
