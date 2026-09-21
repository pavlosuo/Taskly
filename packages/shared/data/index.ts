import { countries } from "country-codes-flags-phone-codes";
import * as flags from "country-flag-icons/react/3x2";
import { BankItem } from "@shared/types";
import { Lang } from "@shared/types";

export const countryList = countries.map((c) => ({
  name: c.name,
  code: c.code,
  dial: c.dialCode,
  FlagComponent: flags[c.code as keyof typeof flags] ?? null,
}));

export type Country = (typeof countryList)[number];

export const appName = "Taskly";

export const navLinks = [
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

export const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "english" },
  { value: "fi-FI", label: "finnish" },
  { value: "sv-FI", label: "swedish" },
];

export const WORLD_LANGUAGES = [
  { value: "fi", label: "Finnish" },
  { value: "sv", label: "Swedish" },
  { value: "en", label: "English" },
  { value: "ru", label: "Russian" },
  { value: "et", label: "Estonian" },
  { value: "ar", label: "Arabic" },
  { value: "so", label: "Somali" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "pl", label: "Polish" },
  { value: "uk", label: "Ukrainian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "tr", label: "Turkish" },
  { value: "fa", label: "Persian" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "ur", label: "Urdu" },
  { value: "vi", label: "Vietnamese" },
  { value: "th", label: "Thai" },
  { value: "nl", label: "Dutch" },
  { value: "ro", label: "Romanian" },
  { value: "hu", label: "Hungarian" },
  { value: "cs", label: "Czech" },
  { value: "sk", label: "Slovak" },
  { value: "bg", label: "Bulgarian" },
  { value: "hr", label: "Croatian" },
  { value: "sr", label: "Serbian" },
  { value: "da", label: "Danish" },
  { value: "no", label: "Norwegian" },
  { value: "lt", label: "Lithuanian" },
  { value: "lv", label: "Latvian" },
  { value: "el", label: "Greek" },
  { value: "he", label: "Hebrew" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "tl", label: "Filipino" },
  { value: "sw", label: "Swahili" },
  { value: "am", label: "Amharic" },
  { value: "ku", label: "Kurdish" },
  { value: "az", label: "Azerbaijani" },
  { value: "ka", label: "Georgian" },
  { value: "hy", label: "Armenian" },
  { value: "mn", label: "Mongolian" },
  { value: "kk", label: "Kazakh" },
  { value: "uz", label: "Uzbek" },
];

export const CERF_LEVELS: {
  value: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  label: string;
}[] = [
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Upper Intermediate" },
  { value: "C1", label: "C1 — Advanced" },
  { value: "C2", label: "C2 — Mastery" },
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
