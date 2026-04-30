import { useState } from "react";

type CommentInputProps = {
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  onSubmit: (content: string) => Promise<void> | void;
};

const CommentInput = ({
  placeholder = "Viết bình luận...",
  loading = false,
  autoFocus = false,
  onSubmit,
}: CommentInputProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    await onSubmit(content.trim());
    setContent("");
  };

  return (
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
  );
};

export default CommentInput;
