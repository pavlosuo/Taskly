import { countries } from "country-codes-flags-phone-codes";
import * as flags from "country-flag-icons/react/3x2";
import { BankItem, Lang } from "shared/types";

export const countryList = countries.map((c) => ({
  name: c.name,
  code: c.code,
  dial: c.dialCode,
  FlagComponent: flags[c.code as keyof typeof flags] ?? null,
}));

export type Country = (typeof countryList)[number];

export const COUNTRY_CODES_LIST = ["fi"];

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const APP_NAME = "Taskly";

export const NAV_LINKS = [
  { label: "Find Taskers", href: "/users" },
  { label: "Browse Tasks", href: "/tasks" },
  { label: "Top Taskers", href: "/top" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Statistics", href: "/stats" },
];

export const FINNISH_BANKS: BankItem[] = [
  { value: "op", label: "OP", src: "/banks/fi-op.svg" },
  { value: "nordea", label: "Nordea", src: "/banks/fi-nordea.svg" },
  { value: "s-pankki", label: "S-Pankki", src: "/banks/fi-spankki.svg" },
  {
    value: "danskebank",
    label: "Danske Bank",
    src: "/banks/fi-danskebank.svg",
  },
  {
    value: "saastopankki",
    label: "Säästöpankki",
    src: "/banks/fi-saastopankki.svg",
  },
  { value: "pop", label: "POP Pankki", src: "/banks/fi-pop.svg" },
  { value: "aktia", label: "Aktia", src: "/banks/fi-aktia.svg" },
  { value: "omasp", label: "OmaSp", src: "/banks/fi-omasp.svg" },
  {
    value: "alandsbanken",
    label: "Ålandsbanken",
    src: "/banks/fi-alandsbanken.svg",
  },
];

export const FINNISH_BANKS_VALUES: (typeof FINNISH_BANKS)[number]["value"][] =
  FINNISH_BANKS.map((b) => b.value);

export const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "general.english" },
  { value: "fi-FI", label: "general.finnish" },
  { value: "sv-FI", label: "general.swedish" },
];

export const WORLD_LANGUAGES = [
  { value: "fi", label: "general.finnish" },
  { value: "sv", label: "general.swedish" },
  { value: "en", label: "general.english" },
  { value: "ru", label: "general.russian" },
  { value: "et", label: "general.estonian" },
  { value: "ar", label: "general.arabic" },
  { value: "so", label: "general.somali" },
  { value: "fr", label: "general.french" },
  { value: "de", label: "general.german" },
  { value: "es", label: "general.spanish" },
  { value: "it", label: "general.italian" },
  { value: "pt", label: "general.portuguese" },
  { value: "pl", label: "general.polish" },
  { value: "uk", label: "general.ukrainian" },
  { value: "zh", label: "general.chinese" },
  { value: "ja", label: "general.japanese" },
  { value: "ko", label: "general.korean" },
  { value: "tr", label: "general.turkish" },
  { value: "fa", label: "general.persian" },
  { value: "hi", label: "general.hindi" },
  { value: "bn", label: "general.bengali" },
  { value: "ur", label: "general.urdu" },
  { value: "vi", label: "general.vietnamese" },
  { value: "th", label: "general.thai" },
  { value: "nl", label: "general.dutch" },
  { value: "ro", label: "general.romanian" },
  { value: "hu", label: "general.hungarian" },
  { value: "cs", label: "general.czech" },
  { value: "sk", label: "general.slovak" },
  { value: "bg", label: "general.bulgarian" },
  { value: "hr", label: "general.croatian" },
  { value: "sr", label: "general.serbian" },
  { value: "da", label: "general.danish" },
  { value: "no", label: "general.norwegian" },
  { value: "lt", label: "general.lithuanian" },
  { value: "lv", label: "general.latvian" },
  { value: "el", label: "general.greek" },
  { value: "he", label: "general.hebrew" },
  { value: "id", label: "general.indonesian" },
  { value: "ms", label: "general.malay" },
  { value: "tl", label: "general.filipino" },
  { value: "sw", label: "general.swahili" },
  { value: "am", label: "general.amharic" },
  { value: "ku", label: "general.kurdish" },
  { value: "az", label: "general.azerbaijani" },
  { value: "ka", label: "general.georgian" },
  { value: "hy", label: "general.armenian" },
  { value: "mn", label: "general.mongolian" },
  { value: "kk", label: "general.kazakh" },
  { value: "uz", label: "general.uzbek" },
];

export const CERF_LEVELS: {
  value: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  label: string;
}[] = [
  { value: "A1", label: "general.cerfA1" },
  { value: "A2", label: "general.cerfA2" },
  { value: "B1", label: "general.cerfB1" },
  { value: "B2", label: "general.cerfB2" },
  { value: "C1", label: "general.cerfC1" },
  { value: "C2", label: "general.cerfC2" },
];

export const CERF = CERF_LEVELS.map((l) => l.value);

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export const EMOJI = ["👀", "😢", "👍", "🔥", "❤️"];
