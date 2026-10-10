export function formatListTime(value: string | Date, lang: string) {
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(lang, { month: "short", day: "numeric" });
}
