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

export const finnishBanks = [
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
] as BankItem[];

export const langs: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fi", label: "Suomi" },
  { value: "sv", label: "Svenska" },
];

export const notificationsList = [
  {
    key: "email",
    label: "Email notifications",
    desc: "Receive updates via email.",
  },
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
] as const;

export const CEFR_LEVELS = [
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Upper Intermediate" },
  { value: "C1", label: "C1 — Advanced" },
  { value: "C2", label: "C2 — Mastery" },
] as const;
