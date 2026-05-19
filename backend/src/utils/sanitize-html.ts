import DOMPurify, { type Config } from "isomorphic-dompurify";
import {
  PostContentFormat,
  type PostContentFormat as PostContentFormatType,
} from "../constants/post-content-format";
import { PostContentError } from "./post-content-error";

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
  ALLOWED_ATTR: ["style", "href", "target", "rel"],
};

export function sanitizePostHtml(html: string): string {
  ensureColorStyleHook();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}

export function isRichTextEmpty(html: string): boolean {
  if (!html?.trim()) return true;

  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/\u00a0/g, " ")
    .trim();

  return text.length === 0;
}

export function isProbablyPlainText(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  return !/<[a-z][\s\S]*>/i.test(trimmed);
}

export type ProcessedPostContent = {
  content: string;
  contentFormat: PostContentFormatType;
};

/** Chuẩn hóa nội dung trước khi lưu DB */
export function processPostContent(
  rawContent: string,
  format: PostContentFormatType = PostContentFormat.HTML,
): ProcessedPostContent {
  const trimmed = rawContent.trim();

  if (format === PostContentFormat.PLAIN) {
    if (!trimmed) {
      throw new PostContentError("Nội dung bài viết không được để trống", "CONTENT_EMPTY");
    }
    return {
      content: trimmed,
      contentFormat: PostContentFormat.PLAIN,
    };
  }

  const sanitized = sanitizePostHtml(trimmed);

  if (isRichTextEmpty(sanitized)) {
    throw new PostContentError("Nội dung bài viết không được để trống", "CONTENT_EMPTY");
  }

  return {
    content: sanitized,
    contentFormat: PostContentFormat.HTML,
  };
}

/** Tự nhận format cho bài cũ chưa có contentFormat */
export function resolveContentFormat(
  content: string,
  contentFormat?: PostContentFormatType | null,
): PostContentFormatType {
  if (contentFormat) return contentFormat;
  return isProbablyPlainText(content)
    ? PostContentFormat.PLAIN
    : PostContentFormat.HTML;
}
