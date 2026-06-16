import { useEffect, useState } from "react";
import { BarChart3, Check, Loader2, X } from "lucide-react";
import { pollApi } from "@/features/poll/api/poll.api";
import type { PollSummary } from "@/types/poll.type";
import { toast } from "sonner";

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + second).toUpperCase();
};

interface PollCardProps {
  poll: PollSummary;
  onVote?: (updated: PollSummary) => void;
  compact?: boolean;
}

const PollCard = ({ poll, onVote, compact = false }: PollCardProps) => {
  const [localPoll, setLocalPoll] = useState(poll);
  const [selected, setSelected] = useState<number[]>(poll.myVotes);
  const [voting, setVoting] = useState(false);
  const [expandedOptionId, setExpandedOptionId] = useState<number | null>(null);
  const [editingVote, setEditingVote] = useState(poll.myVotes.length === 0);

  useEffect(() => {
    setLocalPoll(poll);
    setSelected(poll.myVotes);
    setExpandedOptionId(null);
    setEditingVote(poll.myVotes.length === 0);
  }, [poll]);

  const isClosed = localPoll.status !== "ACTIVE";
  const hasVoted = localPoll.myVotes.length > 0;
  const showResults = hasVoted || isClosed;
  const totalVotes = localPoll.totalVotes || 0;
  const canEdit = !isClosed && editingVote;

  const compactPad = compact ? "p-3" : "p-4";

  const toggleOption = (optionId: number) => {
    if (!canEdit || voting) return;

    if (localPoll.allowMultiple) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất một lựa chọn");
      return;
    }

    try {
      setVoting(true);
      const res = await pollApi.vote(localPoll.id, selected);
      setLocalPoll(res.data);
      setSelected(res.data.myVotes);
      onVote?.(res.data);
      setEditingVote(false);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể bình chọn. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 ${compactPad}`}
    >
      <div className="flex items-start gap-2 mb-3">
        <BarChart3
          size={18}
          className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
        />
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
          {localPoll.question}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200/70 dark:border-slate-700/70 overflow-hidden">
        {localPoll.options.map((option, idx) => {
          const isMyVote = localPoll.myVotes.includes(option.id);
          const isSelected = selected.includes(option.id);
          const isChecked = editingVote ? isSelected : isMyVote;
          const isExpanded = expandedOptionId === option.id;

          return (
            <div
              key={option.id}
              className={`${
                idx > 0
                  ? "border-t border-slate-200/70 dark:border-slate-700/70"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isClosed && editingVote) {
                      toggleOption(option.id);
                      return;
                    }
                    // Khi đang ở trạng thái xem kết quả, click để mở danh sách người vote
                    if (hasVoted) {
                      setExpandedOptionId((prev) =>
                        prev === option.id ? null : option.id,
                      );
                    }
                  }}
                  className="flex-1 flex items-center gap-2 min-w-0 text-left"
                  disabled={isClosed || (editingVote ? voting : false)}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      isChecked
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-300 dark:border-slate-600 bg-transparent"
                    }`}
                  >
                    {isChecked ? (
                      <Check
                        size={14}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    ) : null}
                  </div>

                  <span className="text-sm text-slate-800 dark:text-slate-100 truncate">
                    {option.label}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {showResults && (
                    <div className="flex items-center -space-x-1">
                      {option.voters.slice(0, compact ? 2 : 3).map((v) => (
                        <span
                          key={v.id}
                          className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center ring-2 ring-slate-50/90 dark:ring-slate-800/90"
                          title={v.fullName}
                        >
                          {getInitials(v.fullName)}
                        </span>
                      ))}
                      {option.voters.length > (compact ? 2 : 3) && (
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-200 flex items-center justify-center ring-2 ring-slate-50/90 dark:ring-slate-800/90">
                          +{option.voters.length - (compact ? 2 : 3)}
                        </span>
                      )}
                    </div>
                  )}

                  <span className="text-sm font-bold text-slate-700 dark:text-slate-100">
                    +{option.voteCount}
                  </span>
                </div>
              </div>

              {isExpanded && showResults && hasVoted && (
                <div className="px-3 pb-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Người đã bình chọn
                  </div>
                  {option.voters.length === 0 ? (
                    <div className="text-xs text-slate-500">Chưa có ai</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {option.voters.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-[10px] font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center">
                            {getInitials(v.fullName)}
                          </span>
                          <span className="text-xs text-slate-800 dark:text-slate-100">
                            {v.fullName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {totalVotes} lượt bình chọn
          {localPoll.allowMultiple ? " · Chọn nhiều" : ""}
        </span>

        {!isClosed && (
          <div className="flex items-center gap-2">
            {!editingVote && hasVoted ? (
              <button
                type="button"
                onClick={() => {
                  setSelected(localPoll.myVotes);
                  setExpandedOptionId(null);
                  setEditingVote(true);
                }}
                disabled={voting}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors disabled:opacity-50"
              >
                Thay đổi bình chọn
              </button>
            ) : null}

            {editingVote ? (
              <button
                type="button"
                onClick={handleVote}
                disabled={voting || selected.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 transition-colors"
              >
                {voting && <Loader2 size={14} className="animate-spin" />}
                {hasVoted ? "Cập nhật bình chọn" : "Bình chọn"}
              </button>
            ) : null}

            {editingVote ? (
              <button
                type="button"
                onClick={() => {
                  setSelected(localPoll.myVotes);
                  setExpandedOptionId(null);
                  setEditingVote(false);
                }}
                disabled={voting}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
                aria-label="Hủy"
                title="Hủy"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollCard;
