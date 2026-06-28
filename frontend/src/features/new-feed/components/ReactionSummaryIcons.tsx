import type {
  ReactionSummary,
  ReactionType,
} from "@/features/new-feed/api/reaction.api";

type ReactionSummaryIconsProps = {
  summary: ReactionSummary;
};

const reactionOrder: ReactionType[] = [
  "LIKE",
  "LOVE",
  "HAHA",
  "WOW",
  "SAD",
  "ANGRY",
];

const reactionIcons: Record<ReactionType, string> = {
  LIKE: "/icons/like.png",
  LOVE: "/icons/love.png",
  HAHA: "/icons/haha.png",
  WOW: "/icons/wow.png",
  SAD: "/icons/sad.png",
  ANGRY: "/icons/angry.png",
};

const ReactionSummaryIcons = ({ summary }: ReactionSummaryIconsProps) => {
  const topReactions = reactionOrder
    .filter((type) => summary[type] > 0)
    .sort((a, b) => summary[b] - summary[a])
    .slice(0, 3);

  if (topReactions.length === 0) return null;

  return (
    <div className="flex items-center">
      {topReactions.map((type, index) => (
        <span
          key={type}
          className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-white dark:bg-slate-900"
          style={{
            marginLeft: index === 0 ? 0 : -6,
            zIndex: topReactions.length - index,
          }}
        >
          <img
            src={reactionIcons[type]}
            alt={type}
            className="h-[18px] w-[18px] object-contain"
          />
        </span>
      ))}
    </div>
  );
};

export default ReactionSummaryIcons;
