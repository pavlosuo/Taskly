"use client";
import { useEffect, useRef, useState, startTransition } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/shared/Input";
import { Tag } from "shared/types";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";
import { getAxiosError } from "@/utils/getAxiosError";
import { useToast } from "@/hooks/useToast";

type TagInputProps = {
  value: Tag[];
  onChange: (value: Tag[]) => void;
  searchFn: (search: string) => Promise<Tag[]>;
  createFn?: (label: string) => Promise<Tag>;
  placeholder?: string;
  name: string;
  label?: string;
  error?: string;
  hideErrorLabel?: boolean;
};

export function TagInput({
  value,
  onChange,
  searchFn,
  createFn,
  placeholder,
  name,
  label,
  error,
  hideErrorLabel = false,
}: TagInputProps) {
  const { t } = useTranslation("common");
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const addingRef = useRef(false);

  useEffect(() => {
    if (!search.trim()) {
      startTransition(() => {
        setSuggestions([]);
        setLoading(false);
      });
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchFn(search.trim());
        if (!cancelled) setSuggestions(result);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search, searchFn]);

  const addTag = async (tagLabel: string) => {
    const trimmed = tagLabel.trim();
    if (!trimmed || addingRef.current) return;
    if (
      value.some((tag) => tag.label.toLowerCase() === trimmed.toLowerCase())
    ) {
      setSearch("");
      return;
    }
    addingRef.current = true;
    try {
      const tag: Tag = createFn
        ? await createFn(trimmed)
        : ({ value: trimmed, label: trimmed } as Tag);
      onChange([...value, tag]);
      setSearch("");
      setSuggestions([]);
    } catch (e) {
      toast(getAxiosError(e));
    } finally {
      addingRef.current = false;
    }
  };

  const removeTag = (tagValue: string) => {
    onChange(value.filter((tag) => tag.value !== tagValue));
  };

  const exactMatch = suggestions.some(
    (tag) => tag.label.toLowerCase() === search.trim().toLowerCase(),
  );

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag.value}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {tag.label}
              <button
                type="button"
                onClick={() => removeTag(tag.value)}
                aria-label={t("tagInput.remove", { name: tag.label })}
                className="ml-0.5 transition-colors hover:text-destructive"
              >
                <X aria-hidden="true" className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div>
        {label && (
          <Label htmlFor={name} error={!!error}>
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            value={search}
            error={error}
            placeholder={placeholder ?? t("tagInput.placeholder")}
            onChange={(e) => setSearch(e.target.value)}
            name={name}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                e.preventDefault();
                addTag(search);
              }
            }}
          />
          {loading && (
            <Loader2
              aria-hidden="true"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-grey"
            />
          )}
        </div>
        {!hideErrorLabel && <FieldError message={error} />}
      </div>
      {(suggestions.length > 0 || (search.trim() && !exactMatch)) && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => addTag(tag.label)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:border-primary/50"
            >
              {tag.label}
            </button>
          ))}
          {search.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => addTag(search)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary px-2.5 py-1 text-xs text-primary"
            >
              <Plus aria-hidden="true" className="h-3 w-3" />
              {t("tagInput.add", { value: search.trim() })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
