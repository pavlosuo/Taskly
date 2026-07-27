"use client";
import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { countryList, type Country } from "@shared/index";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { PhoneNumberUtil, AsYouTypeFormatter } from "google-libphonenumber";

const util = PhoneNumberUtil.getInstance();
const nsnLengthCache = new Map<string, number>();
const placeholderCache = new Map<string, string>();
const ITEM_H = 36;
const VISIBLE_H = 208;
const OVERSCAN = 3;

function formatNSN(nsn: string, regionCode: string): string {
  if (!nsn) return "";
  const prefix = util.getNddPrefixForRegion(regionCode, true) ?? "";
  let countryCallingCode = "";
  try {
    countryCallingCode =
      util.getExampleNumber(regionCode).getCountryCode()?.toString() ?? "";
  } catch {}
  const usePrefix = prefix && prefix !== countryCallingCode;
  const formatter = new AsYouTypeFormatter(regionCode);
  const input = usePrefix ? prefix + nsn : nsn;
  let result = "";
  for (const digit of input) {
    result = formatter.inputDigit(digit);
  }
  if (usePrefix && result.startsWith(prefix)) {
    result = result.slice(prefix.length).replace(/^[\s\-()]/, "");
  }
  return result;
}

function getNSNMaxLength(regionCode: string): number {
  if (nsnLengthCache.has(regionCode)) return nsnLengthCache.get(regionCode)!;
  try {
    const len = util
      .getExampleNumber(regionCode)
      .getNationalNumber()!
      .toString().length;
    nsnLengthCache.set(regionCode, len);
    return len;
  } catch {
    return 10;
  }
}

function getPhonePlaceholder(regionCode: string): string {
  if (placeholderCache.has(regionCode))
    return placeholderCache.get(regionCode)!;
  try {
    const nsn = util
      .getExampleNumber(regionCode)
      .getNationalNumber()!
      .toString();
    const formatted = formatNSN(nsn, regionCode);
    placeholderCache.set(regionCode, formatted);
    return formatted;
  } catch {
    return "000 000 0000";
  }
}

function parsePastedPhone(
  raw: string,
  countryList: Country[],
): { country: Country; nsn: string } | null {
  const trimmed = raw.trim();
  const hasIntl = trimmed.startsWith("+") || trimmed.startsWith("00");
  if (!hasIntl) return null;
  try {
    const parsed = util.parseAndKeepRawInput(trimmed, undefined);
    if (!util.isValidNumber(parsed)) return null;
    const regionCode = util.getRegionCodeForNumber(parsed);
    if (!regionCode) return null;
    const nsn = parsed.getNationalNumber()?.toString();
    if (!nsn) return null;
    const country = countryList.find((c) => c.code === regionCode);
    if (!country) return null;
    return { country, nsn };
  } catch {
    return null;
  }
}

const Flag = memo(function Flag({ country }: { country: Country }) {
  if (!country.FlagComponent) {
    return (
      <span className="w-5 text-xs text-center shrink-0">{country.code}</span>
    );
  }
  return (
    <country.FlagComponent
      className="w-4 h-3 rounded-xs shrink-0"
      aria-hidden
    />
  );
});

const CountryItem = memo(function CountryItem({
  c,
  isSelected,
  style,
}: {
  c: Country;
  isSelected: boolean;
  style: React.CSSProperties;
}) {
  return (
    <div
      data-code={c.code}
      style={style}
      className={clsx(
        "absolute top-0 left-0 w-full flex items-center gap-2.5 px-3 text-sm cursor-pointer hover:bg-input rounded-sm",
        isSelected ? "text-secondary" : "text-grey",
      )}
    >
      <Flag country={c} />
      <span className="flex-1 text-left truncate">{c.name}</span>
      <span className="text-xs shrink-0">{c.dial}</span>
    </div>
  );
});

function VirtualList({
  items,
  selectedCode,
  onMouseDown,
}: {
  items: Country[];
  selectedCode: string;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalH = items.length * ITEM_H;

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_H) - OVERSCAN);
  const endIdx = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + VISIBLE_H) / ITEM_H) + OVERSCAN,
  );

  const visible: React.ReactNode[] = [];
  for (let i = startIdx; i <= endIdx; i++) {
    visible.push(
      <CountryItem
        key={items[i].code}
        c={items[i]}
        isSelected={items[i].code === selectedCode}
        style={{ top: i * ITEM_H, height: ITEM_H }}
      />,
    );
  }

  return (
    <div
      className="overflow-y-auto"
      style={{ height: Math.min(totalH, VISIBLE_H) }}
      onScroll={(e) => setScrollTop((e.target as HTMLElement).scrollTop)}
      onMouseDown={onMouseDown}
    >
      <div className="relative" style={{ height: totalH }}>
        {visible}
      </div>
    </div>
  );
}

export const PhoneInput = memo(function PhoneInput({
  value,
  onChange,
  setCode,
  id,
  error,
  code,
}: {
  value: string;
  onChange: (formatted: string) => void;
  setCode: (dialCode: string) => void;
  id: string;
  error?: string;
  code?: string;
}) {
  const [selected, setSelected] = useState<Country>(() => {
    const initial = code
      ? countryList.find((c: Country) => c.dial === code)
      : undefined;
    if (initial && initial.code === "AX") {
      return (
        countryList.find((c: Country) => c.code === "FI") ?? countryList[0]
      );
    }
    return (
      initial ??
      countryList.find((c: Country) => c.code === "FI") ??
      countryList[0]
    );
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxLen = useMemo(() => getNSNMaxLength(selected.code), [selected.code]);
  const placeholder = useMemo(
    () => getPhonePlaceholder(selected.code),
    [selected.code],
  );

  const filtered = useMemo(
    () =>
      query
        ? countryList.filter(
            (c: Country) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.dial.includes(query),
          )
        : countryList,
    [query],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const applyCountry = useCallback(
    (country: Country, nsn?: string) => {
      setSelected(country);
      setCode(country.dial);
      const digits = (nsn ?? value.replace(/\D/g, "")).slice(
        0,
        getNSNMaxLength(country.code),
      );
      onChange(formatNSN(digits, country.code));
    },
    [value, onChange, setCode],
  );

  const handleToggle = useCallback(() => {
    setOpen((v) => {
      if (!v) requestAnimationFrame(() => searchRef.current?.focus());
      else setQuery("");
      return !v;
    });
  }, []);

  const handleListMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-code]");
      if (!el) return;
      const country = countryList.find(
        (c: Country) => c.code === el.dataset.code,
      );
      if (!country) return;
      applyCountry(country);
      setOpen(false);
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [applyCountry],
  );

  const handlePhone = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, maxLen);
      onChange(formatNSN(digits, selected.code));
    },
    [selected.code, maxLen, onChange],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const raw = e.clipboardData.getData("text");
      const parsed = parsePastedPhone(raw, countryList);
      if (!parsed) return;
      e.preventDefault();
      applyCountry(parsed.country, parsed.nsn);
    },
    [applyCountry],
  );

  const handleQuery = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    [],
  );

  return (
    <div className="flex gap-2">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleToggle}
          className={clsx(
            "w-25 flex items-center gap-1.5 h-10 px-3 bg-transparent dark:bg-input/30 border text-sm text-grey",
            error ? "border-red" : "border-border",
          )}
        >
          <Flag country={selected} />
          <span>{selected.dial}</span>
          <svg
            className={clsx("w-3 h-3 ml-0.5 transition", {
              "rotate-180": open,
            })}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          className={clsx(
            "absolute z-50 top-[calc(100%+4px)] left-0 w-64 bg-background border border-border rounded-xl shadow-lg overflow-hidden transition-opacity duration-75",
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          )}
        >
          <div className="p-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              autoComplete="off"
              id="phone-search"
              name="phone-search"
              placeholder="Search..."
              value={query}
              onChange={handleQuery}
              className="w-full h-8 px-3 bg-input/30 border border-border text-sm"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray py-4">No results</p>
          ) : (
            <VirtualList
              items={filtered}
              selectedCode={selected.code}
              onMouseDown={handleListMouseDown}
            />
          )}
        </div>
      </div>
      <Input
        ref={inputRef}
        autoComplete="tel"
        type="tel"
        inputMode="numeric"
        value={value}
        id={id}
        name={id}
        placeholder={placeholder}
        onChange={handlePhone}
        onPaste={handlePaste}
        className={clsx(
          "h-10 text-sm placeholder:text-grey",
          error ? "border-red focus-visible:ring-red-75" : "border-border",
        )}
      />
    </div>
  );
});
