export function truncateForSeo(str: string, maxLength = 155): string {
  const trimmed = str.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const sliced = trimmed.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  const safe = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
  return safe.replace(/[.,;:!?-]+$/, "") + "…";
}
