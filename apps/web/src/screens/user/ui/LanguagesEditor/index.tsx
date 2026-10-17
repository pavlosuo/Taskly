"use client";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Input } from "@/components/shared/Input";
import { WORLD_LANGUAGES, CERF_LEVELS } from "shared/data";
import { PublicProfileLang } from "shared/types";
import clsx from "clsx";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { Button } from "@/components/ui/button";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { normalizeSpecial } from "@/utils/normalizeSpecial";

export function LanguagesEditor({
  value,
  onChange,
  error,
}: {
  value: PublicProfileLang[];
  onChange: (langs: PublicProfileLang[]) => void;
  error?: string;
}) {
  const { t } = useTranslation(["profile", "common"]);
  const [search, setSearch] = useState("");
  const { openPicker } = useMediaPicker();

  const filtered = useMemo(() => {
    const query = normalizeSpecial(search);
    if (!query) return WORLD_LANGUAGES.slice(0, 8);
    return WORLD_LANGUAGES.filter((l) =>
      normalizeSpecial(t(`common:${l.label}`)).includes(query),
    ).slice(0, 8);
  }, [search, t]);

  const selectedValues = value.map((l) => l.value);

  const addLang = (lang: (typeof WORLD_LANGUAGES)[number]) => {
    if (selectedValues.includes(lang.value)) return;
    onChange([...value, { value: lang.value, label: lang.label, level: "B1" }]);
    setSearch("");
  };

  const removeLang = (langValue: string) => {
    onChange(value.filter((l) => l.value !== langValue));
  };

  const setLevel = (langValue: string, level: PublicProfileLang["level"]) => {
    onChange(value.map((l) => (l.value === langValue ? { ...l, level } : l)));
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((lang) => (
            <div
              key={lang.value}
              className="flex flex-col gap-2 p-3 border border-border bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {t(`common:${lang.label}`)}
                </p>
                <button
                  type="button"
                  onClick={() => removeLang(lang.value)}
                  className="text-grey hover:text-destructive transition-colors"
                  aria-label={t("languages.removeLanguage")}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {CERF_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() =>
                      setLevel(
                        lang.value,
                        lvl.value as PublicProfileLang["level"],
                      )
                    }
                    title={t(`common:${lvl.label}`)}
                    aria-label={t(`common:${lvl.label}`)}
                    aria-pressed={lang.level === lvl.value}
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded-full border transition-colors",
                      lang.level === lvl.value
                        ? "bg-primary text-white border-primary"
                        : "border-border text-grey hover:border-primary/50",
                    )}
                  >
                    {lvl.value}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {lang.certificate ? (
                  <div className="flex items-center gap-2 relative">
                    <ImageDisplay
                      src={lang.certificate.media?.url || ""}
                      alt={lang.certificate.description || lang.value}
                      className="w-full h-full"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        onChange(
                          value.map((l) =>
                            l.value === lang.value
                              ? { ...l, certificate: undefined }
                              : l,
                          ),
                        );
                      }}
                      className="text-xs absolute top-2.5 left-2.5"
                    >
                      {t("languages.removeCertificate")}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/90 hover:underline"
                    onClick={() =>
                      openPicker({
                        onSelect: (item) =>
                          onChange(
                            value.map((l) =>
                              l.value === lang.value
                                ? {
                                    ...l,
                                    certificate: {
                                      media: Array.isArray(item)
                                        ? item[0]
                                        : item,
                                      description: "",
                                    },
                                  }
                                : l,
                            ),
                          ),
                      })
                    }
                  >
                    {t("languages.addCertificate")}
                  </button>
                )}
              </div>
              {lang.certificate ? (
                <div className="flex flex-col gap-2">
                  <label htmlFor={lang.value} className="text-xs text-grey">
                    {t("languages.descriptionLabel")}
                  </label>
                  <Input
                    placeholder={t("languages.descriptionPlaceholder")}
                    value={lang.certificate?.description || ""}
                    onChange={(e) => {
                      onChange(
                        value.map((l) =>
                          l.value === lang.value
                            ? {
                                ...l,
                                certificate: {
                                  media: l.certificate?.media,
                                  description: e.target.value,
                                },
                              }
                            : l,
                        ),
                      );
                    }}
                    name={lang.value}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <Input
        placeholder={t("languages.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        name="search"
        error={error}
      />
      <div className="flex flex-wrap gap-1.5">
        {filtered.map((lang) => {
          const isSelected = selectedValues.includes(lang.value);
          return (
            <button
              key={lang.value}
              type="button"
              onClick={() => !isSelected && addLang(lang)}
              disabled={isSelected}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                isSelected
                  ? "opacity-30 cursor-default border-border text-grey"
                  : "border-border text-foreground hover:border-primary/50 bg-background",
              )}
            >
              {t(`common:${lang.label}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
