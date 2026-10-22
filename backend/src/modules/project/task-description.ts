import { AppError } from "@/shared/errors/app-error";

const DESCRIPTION_IMAGE_KEY =
  /^tasks\/images\/\d+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$/i;

const IMG_TAG = /<img\b([^>]*?)\/?>/gi;

export function prepareDescriptionForStorage(html: string | null) {
  if (!html?.trim()) {
    return { html: null as string | null, keys: [] as string[] };
  }

  if (/<img\b[^>]*\bsrc\s*=\s*["']data:/i.test(html)) {
    throw new AppError(
      400,
      "Ảnh trong mô tả phải được tải lên, không lưu ảnh nhúng trực tiếp",
    );
  }

  const keys: string[] = [];
  const next = html.replace(IMG_TAG, (tag, rawAttrs: string) => {
    const keyMatch = /\bdata-file-key\s*=\s*"([^"]*)"/i.exec(rawAttrs);
    if (!keyMatch) {
      if (/\bsrc\s*=\s*["']\s*javascript:/i.test(rawAttrs)) return "";
      return tag;
    }

    const key = keyMatch[1];
    if (!DESCRIPTION_IMAGE_KEY.test(key)) {
      throw new AppError(400, "Ảnh trong mô tả không hợp lệ");
    }

    keys.push(key);
    const attrs = /\bsrc\s*=\s*"[^"]*"/i.test(rawAttrs)
      ? rawAttrs.replace(/\bsrc\s*=\s*"[^"]*"/i, `src="${key}"`)
      : ` src="${key}"${rawAttrs}`;
    return `<img${attrs}>`;
  });

  const uniqueKeys = [...new Set(keys)];
  if (uniqueKeys.length > 20) {
    throw new AppError(400, "Mô tả tối đa 20 ảnh");
  }

  if (isDescriptionEmpty(next)) {
    return { html: null, keys: [] as string[] };
  }

  return { html: next, keys: uniqueKeys };
}

export function applyDescriptionImageUrls(
  html: string | null,
  urls: Map<string, string>,
) {
  if (!html) return html;
  return html.replace(IMG_TAG, (tag, rawAttrs: string) => {
    const key = /\bdata-file-key\s*=\s*"([^"]*)"/i.exec(rawAttrs)?.[1];
    const url = key ? urls.get(key) : undefined;
    if (!key || !url) return tag;
    const safeUrl = url.replace(/"/g, "%22");
    const attrs = /\bsrc\s*=\s*"[^"]*"/i.test(rawAttrs)
      ? rawAttrs.replace(/\bsrc\s*=\s*"[^"]*"/i, `src="${safeUrl}"`)
      : ` src="${safeUrl}"${rawAttrs}`;
    return `<img${attrs}>`;
  });
}

function isDescriptionEmpty(html: string) {
  if (/<img\b/i.test(html)) return false;
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();
  return text.length === 0;
}
