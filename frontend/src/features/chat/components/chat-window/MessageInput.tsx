import { useState, type FormEvent, type KeyboardEvent } from "react";
import { PlusCircle, Send, Smile } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <footer className="p-4 bg-surface-container-lowest">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-surface-container rounded-xl flex items-end p-2 gap-2 shadow-inner group focus-within:ring-2 focus-within:ring-primary/20 transition-all"
      >
        <button
          type="button"
          className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          aria-label="Đính kèm"
        >
          <PlusCircle size={22} />
        </button>

        <textarea
          rows={1}
          placeholder="Type your message..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-2 px-1 resize-none max-h-32 font-body text-on-surface placeholder:text-on-surface-variant"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            aria-label="Biểu cảm"
          >
            <Smile size={22} />
          </button>

          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className="bg-primary text-on-primary w-10 h-10 rounded-lg flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            aria-label="Gửi"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </footer>
  );
};

export default MessageInput;
