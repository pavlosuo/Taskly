import { Tag } from "shared/index";

export const LANGS: Tag[] = [
  { value: "en", label: "general.english" },
  { value: "fi-FI", label: "general.finnish" },
  { value: "sv-FI", label: "general.swedish" },
];

export const WORLD_LANGUAGES: Tag[] = [
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
