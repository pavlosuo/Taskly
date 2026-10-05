import { useTheme } from "@/providers/ThemeProvider";

export function useFormatPrice(price: number = 0) {
  const { lang } = useTheme();
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
