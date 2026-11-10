import { useTranslation as useI18nextTranslation } from "react-i18next";

export function useTranslation(namespace?: string | string[]) {
  const translation = useI18nextTranslation(namespace);
  return {
    t: translation.t,
    i18n: translation.i18n,
    ready: translation.ready,
  };
}
