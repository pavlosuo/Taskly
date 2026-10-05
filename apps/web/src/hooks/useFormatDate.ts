import { useTheme } from "@/providers/ThemeProvider";

export function useFormatDate(
  dateStr?: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  const { lang } = useTheme();
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(lang, options);
}
