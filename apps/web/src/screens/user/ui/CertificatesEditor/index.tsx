"use client";
import { useState, useEffect, startTransition } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { X, Plus, Loader2, BadgeCheck, ImageIcon, Trash2 } from "lucide-react";
import { Input } from "@/components/shared/Input";
import { axiosApi } from "@/api/index";
import { PublicProfileCertificate, MediaItem } from "shared/types";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import clsx from "clsx";

export function CertificatesEditor({
  value,
  onChange,
  error,
}: {
  value: PublicProfileCertificate[];
  onChange: (certs: PublicProfileCertificate[]) => void;
  error?: string;
}) {
  const { t } = useTranslation("profile");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<
    { _id: string; label: string; description?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { openPicker } = useMediaPicker();

  useEffect(() => {
    if (!search.trim()) {
      startTransition(() => setSuggestions([]));
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axiosApi.searchCertificates(search);
        if (!cancelled) setSuggestions(data.items);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setLoading(false);
    };
  }, [search]);

  const addCertificate = async (label: string, description?: string) => {
    if (value.find((c) => c.label.toLowerCase() === label.toLowerCase())) {
      setSearch("");
      return;
    }
    try {
      const { data } = await axiosApi.upsertCertificate(label, description);
      onChange([...value, { value: data._id, label: data.label }]);
    } catch {
      return;
    }
    setSearch("");
    setSuggestions([]);
  };

  const removeCertificate = (certValue: string) => {
    onChange(value.filter((c) => c.value !== certValue));
  };

  const setMedia = (certValue: string, media: MediaItem | null) => {
    onChange(value.map((c) => (c.value === certValue ? { ...c, media } : c)));
  };

  const exactMatch = suggestions.find(
    (s) => s.label.toLowerCase() === search.toLowerCase(),
  );

  const showAddButton = Boolean(search.trim()) && !loading && !exactMatch;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((cert) => (
            <div
              key={cert.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    openPicker({
                      accept: "image",
                      onSelect: (media) => setMedia(cert.value, media[0]),
                    })
                  }
                  className={clsx(
                    "w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 transition-colors overflow-hidden",
                    cert.media
                      ? "border-none"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {cert.media ? (
                    <ImageDisplay
                      src={cert.media.url}
                      alt={cert.label}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="w-7.5 h-7.5 text-grey" />
                  )}
                </button>
                {cert.media ? (
                  <button
                    type="button"
                    onClick={() => setMedia(cert.value, null)}
                    className="absolute -bottom-2 -right-2 w-6 h-6 z-20 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-150 hover:bg-destructive group-hover:opacity-100"
                    aria-label={t("certificates.removePhoto")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                  <p className="text-sm font-medium text-foreground truncate">
                    {cert.label}
                  </p>
                </div>
                {!cert.media && (
                  <p className="text-xs text-grey mt-0.5">
                    {t("certificates.addPhotoHint")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeCertificate(cert.value)}
                className="text-grey hover:text-destructive transition-colors shrink-0"
                aria-label={t("certificates.remove")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          name="certificate"
          type="text"
          placeholder={t("certificates.searchPlaceholder")}
          value={search}
          error={error}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              e.preventDefault();
              addCertificate(search.trim());
            }
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-grey" />
        )}
      </div>
      {(suggestions.length > 0 || showAddButton) && (
        <div className="flex flex-col gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => addCertificate(s.label, s.description)}
              className="flex items-start gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 text-left transition-colors bg-background"
            >
              <BadgeCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground">{s.label}</p>
                {s.description && (
                  <p className="text-xs text-grey">{s.description}</p>
                )}
              </div>
            </button>
          ))}
          {showAddButton && (
            <button
              type="button"
              onClick={() => addCertificate(search.trim())}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-primary text-primary text-sm hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("certificates.add", {
                name: search.trim(),
                interpolation: { escapeValue: false },
              })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
