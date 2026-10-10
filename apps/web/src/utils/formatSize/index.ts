export function formatSize(bytes: number, lang?: string) {
  const [value, unit] =
    bytes < 1024
      ? [bytes, "byte"]
      : bytes < 1024 * 1024
        ? [bytes / 1024, "kilobyte"]
        : [bytes / 1024 / 1024, "megabyte"];
  const fractionDigits = unit === "byte" ? 0 : 1;
  return new Intl.NumberFormat(lang, {
    style: "unit",
    unit,
    unitDisplay: "short",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
