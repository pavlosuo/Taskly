import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enLogin from "./locales/en/login.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enForgotPassword from "./locales/en/forgotPassword.json";
import enRegister from "./locales/en/register.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    ns: ["common", "login", "errors", "forgotPassword", "register"],
    resources: {
      en: {
        common: enCommon,
        login: enLogin,
        errors: enErrors,
        forgotPassword: enForgotPassword,
        register: enRegister,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
