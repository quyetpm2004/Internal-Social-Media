export function loadTone(percent: number) {
  if (percent > 100) return "#f43f5e";
  if (percent >= 75) return "#f59e0b";
  return "#10b981";
}
