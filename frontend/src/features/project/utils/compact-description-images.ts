export function compactDescriptionImages(html: string) {
  return html.replace(/<img\b([^>]*?)\/?>/gi, (tag, attrs: string) => {
    const key = /\bdata-file-key\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
    if (!key) return tag;
    const nextAttrs = /\bsrc\s*=\s*"[^"]*"/i.test(attrs)
      ? attrs.replace(/\bsrc\s*=\s*"[^"]*"/i, `src="${key}"`)
      : ` src="${key}"${attrs}`;
    return `<img${nextAttrs}>`;
  });
}
