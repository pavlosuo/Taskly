export function removeHtml(str: string) {
  if (!str) return "";
  return str.replace(/<\/?[^>]+(>|$)/g, "");
}
