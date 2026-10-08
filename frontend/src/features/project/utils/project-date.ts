export function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

export function formatProjectDate(value: string, language: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB").format(
    new Date(year, month - 1, day),
  );
}
