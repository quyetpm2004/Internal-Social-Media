import { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MENTION_ALL_SENTINEL_ID,
  MENTION_ALL_TOKEN,
  normalizeMentionRefs,
  parseMentionSegments,
} from "@/features/mention/utils/mention";

type MentionTextProps = {
  content: string;
  mentions?: unknown;
  className?: string;
};

const MentionText = ({
  content,
  mentions,
  className = "",
}: MentionTextProps) => {
  const knownMentions = useMemo(
    () => normalizeMentionRefs(mentions),
    [mentions],
  );

  const parts = useMemo(
    () => parseMentionSegments(content, knownMentions),
    [content, knownMentions],
  );

  if (parts.length === 0) {
    return (
      <span className={`whitespace-pre-wrap wrap-break-word ${className}`}>
        {content}
      </span>
    );
  }

  return (
    <span className={`whitespace-pre-wrap wrap-break-word ${className}`}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <Fragment key={`text-${index}`}>{part.value}</Fragment>;
        }

        if (part.type === "mention") {
          if (part.userId === MENTION_ALL_SENTINEL_ID) {
            return (
              <span
                key={`mention-all-${index}`}
                className="font-semibold text-blue-600 dark:text-blue-400"
              >
                {MENTION_ALL_TOKEN}
              </span>
            );
          }

          return (
            <Link
              key={`mention-${part.userId}-${index}`}
              to={`/profile/${part.userId}`}
              className={`font-semibold text-blue-600 dark:text-blue-400 hover:underline ${className}`}
              onClick={(event) => event.stopPropagation()}
            >
              @{part.label}
            </Link>
          );
        }

        return null;
      })}
    </span>
  );
};

export default MentionText;
