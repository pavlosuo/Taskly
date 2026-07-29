export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fi-FI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
