"use client";
import { useState, ReactNode } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Loader2,
  RotateCcw,
  SearchX,
  LocateFixed,
} from "lucide-react";
import clsx from "clsx";
import { axiosApi } from "@/api/index";
import { Input, PriceInput, TagInput } from "@/components/shared/Input";
import { Label } from "@/components/shared/Label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  StatusOption,
  TaskFilters,
  TaskSort,
  TASK_DEFAULT_FILTERS,
  TASK_SORT_OPTIONS,
  TASK_RADIUS_OPTIONS,
} from "shared/index";
import { countActiveFilters } from "@/utils/tasksUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TaskTabs = <T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className="inline-flex w-full items-center gap-1 border border-border bg-muted/30 p-1 sm:w-auto rounded-full">
    {tabs.map((t) => {
      const active = t.value === value;
      return (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={clsx(
            "rounded-full flex flex-1 items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none",
            active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={clsx(
                "px-1.5 text-[11px] font-semibold tabular-nums rounded-full",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/10 text-muted-foreground",
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export const TaskToolbar = ({
  query,
  onQueryChange,
  isSearching,
  filters,
  onFiltersChange,
  statusOptions = [],
  placeholder = "Search by title or description...",
}: {
  query: string;
  onQueryChange: (q: string) => void;
  isSearching?: boolean;
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
  statusOptions?: StatusOption[];
  placeholder?: string;
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const activeCount = countActiveFilters(filters);

  const patch = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support geolocation.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onFiltersChange({
          ...filters,
          near: { lat: coords.latitude, lng: coords.longitude },
          sort: "distance",
        });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === 1
            ? "Location access was denied. Allow it in your browser settings."
            : "Couldn't get your location. Try again.",
        );
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const clearNear = () =>
    onFiltersChange({
      ...filters,
      near: null,
      sort: filters.sort === "distance" ? "newest" : filters.sort,
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-grey" />
          <Input
            name="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {isSearching ? (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-grey" />
          ) : (
            query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-grey hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen((p) => !p)}
          aria-expanded={panelOpen}
          aria-label="Filters"
          className={clsx(
            "flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
            panelOpen || activeCount > 0
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-border text-grey hover:bg-muted hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="rounded-full flex h-4.5 min-w-4.5 items-center justify-center bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>
      {statusOptions.length > 0 && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {statusOptions.map((s) => {
            const active = filters.status === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => patch("status", s.value)}
                className={clsx(
                  "flex rounded-full shrink-0 items-center gap-1.5 border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s.label}
                <span
                  className={clsx(
                    "tabular-nums",
                    active ? "text-primary-foreground/80" : "text-grey",
                  )}
                >
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {panelOpen && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="form-group">
            <Label htmlFor="filter-sort">Sort by</Label>
            <Select
              value={filters.sort}
              onValueChange={(s) => patch("sort", s as TaskSort)}
            >
              <SelectTrigger
                className={clsx(
                  "h-10 text-sm relative placeholder:text-grey w-full",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {TASK_SORT_OPTIONS.filter(
                  (o) => o.value !== "distance" || filters.near,
                ).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="form-group">
            <Label htmlFor="filter-min">Budget from</Label>
            <PriceInput
              name="filter-min"
              value={filters.minBudget}
              onChange={(n) => patch("minBudget", n)}
              placeholder="Any"
            />
          </div>
          <div className="form-group">
            <Label htmlFor="filter-max">Budget up to</Label>
            <PriceInput
              name="filter-max"
              value={filters.maxBudget}
              onChange={(n) => patch("maxBudget", n)}
              placeholder="Any"
            />
          </div>
          <div className="flex items-end">
            <div className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-border px-3">
              <span className="text-sm text-foreground">Negotiable only</span>
              <Switch
                checked={filters.onlyNegotiable}
                onCheckedChange={(v) => patch("onlyNegotiable", v)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <TagInput
              label="Skills"
              name="filter-skills"
              value={filters.skills}
              onChange={(v) => patch("skills", v)}
              placeholder="Any of these skills..."
              searchFn={async (search: string) => {
                const { data } = await axiosApi.searchSkills(search);
                return data.items.map((s) => ({
                  value: s._id,
                  label: s.label,
                }));
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <TagInput
              label="Certificates"
              name="filter-certificates"
              value={filters.certificates}
              onChange={(v) => patch("certificates", v)}
              placeholder="Any of these certificates..."
              searchFn={async (search: string) => {
                const { data } = await axiosApi.searchCertificates(search);
                return data.items.map((c) => ({
                  value: c._id,
                  label: c.label,
                }));
              }}
            />
          </div>
          <div className="flex flex-col items-center gap-2 border-t border-border pt-4 sm:col-span-2 lg:col-span-4">
            {filters.near ? (
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border border-primary/20 bg-primary/5 py-1.5 pl-4 pr-1.5">
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <LocateFixed className="h-4 w-4" />
                  Within
                </span>
                <Select
                  aria-label="Search radius"
                  value={filters.radiusKm.toString()}
                  onValueChange={(s) => patch("radiusKm", Number(s))}
                >
                  <SelectTrigger
                    className={clsx(
                      "text-sm relative placeholder:text-grey border border-primary/20 bg-primary/5",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {TASK_RADIUS_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r.toString()}>
                        {r} km
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  of your location
                </span>
                <button
                  type="button"
                  onClick={clearNear}
                  aria-label="Remove location filter"
                  className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={locate}
                disabled={locating}
                className="px-4"
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
                Tasks near me
              </Button>
            )}
            {geoError && (
              <p role="alert" className="text-center text-xs text-destructive">
                {geoError}
              </p>
            )}
          </div>
          {activeCount > 0 && (
            <div className="flex w-full justify-end sm:col-span-2 lg:col-span-4">
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  onFiltersChange({
                    ...TASK_DEFAULT_FILTERS,
                    status: filters.status,
                  })
                }
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TaskEmptyState = ({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      {icon ?? <SearchX className="h-5 w-5" />}
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {text && <p className="mt-1 text-xs text-grey">{text}</p>}
    </div>
    {action}
  </div>
);
