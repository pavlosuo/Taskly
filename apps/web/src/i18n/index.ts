import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { LANGS } from "shared/data";
import en from "@/i18n/locales/en";
import fi from "@/i18n/locales/fi-FI";
import sv from "@/i18n/locales/sv-FI";

const resources = { en, "fi-FI": fi, "sv-FI": sv };

export const defaultNS = "common";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "fi-FI",
    fallbackLng: "fi-FI",
    supportedLngs: LANGS.map((l) => l.value),
    ns: Object.keys(en),
    defaultNS,
    resources,
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
