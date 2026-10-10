import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { LANGS } from "shared/data";
import en from "@/i18n/locales/en";

const resources = { en };

export const defaultNS = "common";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
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
