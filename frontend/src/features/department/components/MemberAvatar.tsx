import { cn } from "@/lib/utils";
import { AVATAR_TONES } from "@/features/department/utils/department-task";

type MemberAvatarProps = {
  id: number;
  name: string;
  className?: string;
};

export default function MemberAvatar({ id, name, className }: MemberAvatarProps) {
  const initial = name.trim().split(" ").pop()?.slice(0, 1) ?? "?";

  return (
    <span
      title={name}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
        AVATAR_TONES[id % AVATAR_TONES.length],
        className,
      )}
    >
      {initial}
    </span>
  );
}
