"use client";
import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { countryList, type Country } from "@/data/phones";
import clsx from "clsx";

const ITEM_H = 36;
const VISIBLE_H = 208;
const OVERSCAN = 3;

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
        "absolute left-0 right-0 flex items-center gap-2.5 px-3 text-sm cursor-pointer hover:bg-gray-50",
        isSelected ? "bg-blue-50 text-blue-600" : "text-gray-700",
      )}
    >
      <Flag country={c} />
      <span className="flex-1 text-left truncate">{c.name}</span>
      <span className="text-gray-400 text-xs shrink-0">{c.dial}</span>
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

  const visible = [];
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
}: {
  value: string;
  onChange: (phone: string) => void;
  code: string;
  setCode: (code: string) => void;
  id: string;
  error?: string;
}) {
  const [selected, setSelected] = useState<Country>(
    () => countryList.find((c) => c.code === "SG") ?? countryList[0],
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      query
        ? countryList.filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.dial.includes(query),
          )
        : countryList,
    [query],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = useCallback(() => {
    setOpen((v) => {
      const next = !v;
      setQuery("");
      if (next) {
        requestAnimationFrame(() => searchRef.current?.focus());
      }
      return next;
    });
  }, []);

  const handleListMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const item = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-code]",
      );
      if (!item) return;
      const country = countryList.find((c) => c.code === item.dataset.code);
      if (!country) return;
      setSelected(country);
      setCode(country.dial);
      setOpen(false);
    },
    [setCode],
  );

  const handlePhone = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(e.target.value.replace(/\D/g, "")),
    [onChange],
  );

  const handleQuery = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    [],
  );

  return (
    <div className="flex gap-2">
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={handleToggle}
          className={clsx(
            "w-25 flex items-center gap-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300",
            error
              ? "border-red-400 focus-visible:ring-red-200"
              : "border-gray-200",
          )}
        >
          <Flag country={selected} />
          <span className="text-gray-500">{selected.dial}</span>
          <svg
            className={clsx("w-3 h-3 text-gray-400 ml-0.5 transition", {
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
            "absolute z-50 top-[calc(100%+4px)] left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden transition-opacity duration-75",
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          )}
        >
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              autoComplete="off"
              id="phone-search"
              name="phone-search"
              placeholder="Search..."
              value={query}
              onChange={handleQuery}
              className="w-full h-8 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">No results</p>
          ) : (
            <VirtualList
              items={filtered}
              selectedCode={selected.code}
              onMouseDown={handleListMouseDown}
            />
          )}
        </div>
      </div>
      <input
        autoComplete="tel"
        type="tel"
        value={value}
        id={id}
        name={id}
        placeholder="999 123 4567"
        onChange={handlePhone}
        className={clsx(
          "flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300",
          error
            ? "border-red-400 focus-visible:ring-red-200"
            : "border-gray-200",
        )}
      />
    </div>
  );
});
