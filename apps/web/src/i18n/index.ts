import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en";
import fi from "@/i18n/locales/fi-FI";
import sv from "@/i18n/locales/sv-FI";

const resources = {
  en,
  "fi-FI": fi,
  "sv-FI": sv,
};

export const defaultNS = "common";

export function createI18n(language: string) {
  const instance = i18n.createInstance();

  instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: "fi-FI",
    supportedLngs: Object.keys(resources),
    resources,
    ns: Object.keys(en),
    defaultNS,
    interpolation: { escapeValue: false },
    initAsync: false,
    react: { useSuspense: false },
  });

  return instance;
}
