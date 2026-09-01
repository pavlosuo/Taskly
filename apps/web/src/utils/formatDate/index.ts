export function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString("fi-FI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
