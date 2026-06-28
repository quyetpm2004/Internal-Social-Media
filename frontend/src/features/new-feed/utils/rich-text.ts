import DOMPurify, { type Config } from "dompurify";

let styleHookInstalled = false;

function ensureColorStyleHook() {
  if (styleHookInstalled) return;

  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName !== "style" || !data.attrValue) return;

    const safeDecls = data.attrValue
      .split(";")
      .map((decl) => decl.trim())
      .filter((decl) => /^color\s*:/i.test(decl));

    if (safeDecls.length === 0) {
      data.keepAttr = false;
      return;
    }

    data.attrValue = safeDecls.join("; ");
  });

  styleHookInstalled = true;
}

const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "a",
  ],
  ALLOWED_ATTR: ["style", "href", "target", "rel", "class", "data-mention-id"],
};

export type PostContentFormat = "PLAIN" | "HTML";

export function sanitizePostHtml(html: string): string {
  ensureColorStyleHook();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}

export function isRichTextEmpty(html: string): boolean {
  if (!html?.trim()) return true;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const text =
    doc.body.textContent?.replace(/\u00a0/g, " ").trim() ?? "";

  return text.length === 0;
}

export function isProbablyPlainText(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  return !/<[a-z][\s\S]*>/i.test(trimmed);
}

export function resolveContentFormat(
  content: string,
  contentFormat?: PostContentFormat | null,
): PostContentFormat {
  if (contentFormat) return contentFormat;
  return isProbablyPlainText(content) ? "PLAIN" : "HTML";
}
