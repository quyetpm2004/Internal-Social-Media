import { useState } from "react";
import { useTranslation } from "react-i18next";
import MentionTextarea from "@/features/mention/components/MentionTextarea";
import type { MentionUser } from "@/features/mention/utils/mention";

type CommentInputProps = {
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  allowAnonymous?: boolean;
  mentionCandidates?: MentionUser[];
  excludeMentionUserId?: number;
  onSubmit: (
    content: string,
    isAnonymous?: boolean,
    mentionedUserIds?: number[],
    mentionAll?: boolean,
  ) => Promise<void> | void;
};

const CommentInput = ({
  placeholder,
  loading = false,
  autoFocus = false,
  allowAnonymous = false,
  mentionCandidates,
  excludeMentionUserId,
  onSubmit,
}: CommentInputProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<number[]>([]);
  const [mentionAll, setMentionAll] = useState(false);
  const [commentAsAnonymous, setCommentAsAnonymous] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    await onSubmit(
      content.trim(),
      allowAnonymous && commentAsAnonymous ? true : undefined,
      mentionedUserIds,
      mentionAll,
    );
    setContent("");
    setMentionedUserIds([]);
    setMentionAll(false);
    setCommentAsAnonymous(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <MentionTextarea
          autoFocus={autoFocus}
          value={content}
          onChange={setContent}
          onMentionedUserIdsChange={setMentionedUserIds}
          onMentionAllChange={setMentionAll}
          mentionCandidates={mentionCandidates}
          excludeMentionUserId={excludeMentionUserId}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder ?? t("pages.posts.writeComment")}
          disabled={loading}
          className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-sm outline-none w-full text-slate-900 dark:text-slate-100"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="px-4 py-2 rounded-full bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {t("common.send")}
        </button>
      </div>

      {allowAnonymous && (
        <label className="flex items-center gap-2 cursor-pointer pl-1">
          <input
            type="checkbox"
            checked={commentAsAnonymous}
            onChange={(e) => setCommentAsAnonymous(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t("pages.posts.anonymousComment")}
          </span>
        </label>
      )}
    </div>
  );
};

export default CommentInput;
