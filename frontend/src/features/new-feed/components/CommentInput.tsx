import { useState } from "react";

type CommentInputProps = {
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  allowAnonymous?: boolean;
  onSubmit: (content: string, isAnonymous?: boolean) => Promise<void> | void;
};

const CommentInput = ({
  placeholder = "Viết bình luận...",
  loading = false,
  autoFocus = false,
  allowAnonymous = false,
  onSubmit,
}: CommentInputProps) => {
  const [content, setContent] = useState("");
  const [commentAsAnonymous, setCommentAsAnonymous] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    await onSubmit(
      content.trim(),
      allowAnonymous && commentAsAnonymous ? true : undefined,
    );
    setContent("");
    setCommentAsAnonymous(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          autoFocus={autoFocus}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-sm outline-none text-slate-900 dark:text-slate-100"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="px-4 py-2 rounded-full bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          Gửi
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
            Bình luận ẩn danh
          </span>
        </label>
      )}
    </div>
  );
};

export default CommentInput;
