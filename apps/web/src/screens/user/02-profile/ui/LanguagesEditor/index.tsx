"use client";
import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WORLD_LANGUAGES, CEFR_LEVELS } from "@shared/data";
import { PublicProfileLang } from "@shared/types";
import clsx from "clsx";
import { MediaPicker } from "@/shared/components/MediaPicker";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import { Button } from "@/components/ui/button";

export function LanguagesEditor({
  value,
  onChange,
}: {
  value: PublicProfileLang[];
  onChange: (langs: PublicProfileLang[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const filtered = useMemo(() => {
    if (!search.trim()) return WORLD_LANGUAGES.slice(0, 8);
    return WORLD_LANGUAGES.filter((l) =>
      l.label.toLowerCase().includes(search.toLowerCase()),
    ).slice(0, 8);
  }, [search]);
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
                  {lang.label}
                </p>
                <button
                  type="button"
                  onClick={() => removeLang(lang.value)}
                  className="text-grey hover:text-red transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {CEFR_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() =>
                      setLevel(
                        lang.value,
                        lvl.value as PublicProfileLang["level"],
                      )
                    }
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
                      src={lang.certificate.src}
                      alt={lang.certificate.label}
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
                        )
                      }}
                      className="text-xs absolute top-2.5 left-2.5"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(lang.value)}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add certificate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Input
        placeholder="Search language..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 text-sm"
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
              {lang.label}
            </button>
          );
        })}
      </div>
      <MediaPicker
        open={!!pickerOpen}
        onOpenChange={(o) => !o && setPickerOpen(null)}
        onSelect={(item) => {
          if (!pickerOpen) return;
          onChange(
            value.map((l) =>
              l.value === pickerOpen
                ? {
                    ...l,
                    certificate: { src: item.url, label: item.originalName },
                  }
                : l,
            ),
          );
          setPickerOpen(null);
        }}
      />
    </div>
  );
}
