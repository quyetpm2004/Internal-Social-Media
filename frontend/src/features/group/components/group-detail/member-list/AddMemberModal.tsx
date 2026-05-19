import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

type AddMemberModalProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
};

export const AddMemberModal = ({
  open,
  loading = false,
  onClose,
  onSubmit,
}: AddMemberModalProps) => {
  const [email, setEmail] = useState("");

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const handleClose = () => {
    setEmail("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">Thêm thành viên</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface px-1">
                Email thành viên
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-high border-none outline-none focus:ring-2 focus:ring-surface-tint text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-5 py-2.5 rounded-full text-sm font-bold bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Đang thêm..." : "Thêm thành viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
