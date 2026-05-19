import { useMemo } from "react";
import {
  resolveContentFormat,
  sanitizePostHtml,
  type PostContentFormat,
} from "@/features/new-feed/utils/rich-text";
import "@/features/new-feed/styles/rich-text.css";

type RichTextContentProps = {
  content: string;
  contentFormat?: PostContentFormat | null;
  className?: string;
};

const RICH_TEXT_DISPLAY_CLASS =
  "rich-text-display text-slate-700 dark:text-slate-300 leading-relaxed text-sm break-words " +
  "[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic " +
  "[&_u]:underline [&_s]:line-through [&_strike]:line-through " +
  "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1 " +
  "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-1.5 [&_h3]:mb-0.5 " +
  "[&_p]:mb-1 [&_p:last-child]:mb-0 [&_br]:leading-normal " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 " +
  "[&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400";

const RichTextContent = ({
  content,
  contentFormat,
  className = "",
}: RichTextContentProps) => {
  const rendered = useMemo(() => {
    if (!content?.trim()) return null;

    const format = resolveContentFormat(content, contentFormat);

    if (format === "PLAIN") {
      return { type: "plain" as const, text: content };
    }

    return {
      type: "html" as const,
      html: sanitizePostHtml(content),
    };
  }, [content, contentFormat]);

  if (!rendered) return null;

  if (rendered.type === "plain") {
    return (
      <p
        className={`${RICH_TEXT_DISPLAY_CLASS} whitespace-pre-wrap ${className}`}
      >
        {rendered.text}
      </p>
    );
  }

  return (
    <div
      className={`${RICH_TEXT_DISPLAY_CLASS} ${className}`}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
};

export default RichTextContent;
