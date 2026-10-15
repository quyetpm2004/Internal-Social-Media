import DOMPurify, { type Config } from "dompurify";

const SAFE_COLOR =
  /^(?:#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\))$/i;

function keepSafeStyle(declaration: string) {
  const match = declaration.trim().match(/^([a-z-]+)\s*:\s*(.+)$/i);
  if (!match) return null;

  const property = match[1].toLowerCase();
  const value = match[2].trim();

  if (
    (property === "color" || property === "background-color") &&
    SAFE_COLOR.test(value)
  ) {
    return `${property}: ${value}`;
  }

  if (
    property === "text-align" &&
    /^(left|center|right|justify)$/i.test(value)
  ) {
    return `text-align: ${value.toLowerCase()}`;
  }

  return null;
}

let styleHookInstalled = false;

function ensureColorStyleHook() {
  if (styleHookInstalled) return;

  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName !== "style" || !data.attrValue) return;

    const safeDecls = data.attrValue
      .split(";")
      .map((decl) => keepSafeStyle(decl))
      .filter((decl): decl is string => Boolean(decl));

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
    "blockquote",
    "code",
    "pre",
    "hr",
    "mark",
    "img",
  ],
  ALLOWED_ATTR: [
    "style",
    "href",
    "target",
    "rel",
    "class",
    "data-mention-id",
    "data-color",
    "src",
    "alt",
  ],
};

export type PostContentFormat = "PLAIN" | "HTML";

export function sanitizePostHtml(html: string): string {
  ensureColorStyleHook();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}

export function isRichTextEmpty(html: string): boolean {
  if (!html?.trim()) return true;

  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc.body.querySelector("img")) return false;

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
