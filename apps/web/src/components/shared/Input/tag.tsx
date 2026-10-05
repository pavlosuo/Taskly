"use client";
import { useEffect, useRef, useState, startTransition } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/shared/Input";
import { Tag } from "shared/types";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";

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
  placeholder = "Search or add...",
  name,
  label,
  error,
  hideErrorLabel = false,
}: TagInputProps) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!search.trim()) {
      startTransition(() => setSuggestions([]));
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchFn(search.trim());
        setSuggestions(result);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, searchFn]);

  const addTag = async (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (
      value.some((tag) => tag.label.toLowerCase() === trimmed.toLowerCase())
    ) {
      setSearch("");
      return;
    }
    let tag: Tag;
    if (createFn) {
      tag = await createFn(trimmed);
    } else {
      tag = {
        value: trimmed,
        label: trimmed,
      } as Tag;
    }
    onChange([...value, tag]);
    setSearch("");
    setSuggestions([]);
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
                className="ml-0.5 transition-colors hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        {label && <Label error={!!error}>{label}</Label>}
        <Input
          value={search}
          error={error}
          placeholder={placeholder}
          onChange={(e) => setSearch(e.target.value)}
          name={name}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              e.preventDefault();
              addTag(search);
            }
          }}
        />
        {!hideErrorLabel && <FieldError message={error} />}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-grey" />
        )}
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
              <Plus className="h-3 w-3" />
              {`Add "${search.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
