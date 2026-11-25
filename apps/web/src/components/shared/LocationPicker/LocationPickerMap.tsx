"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Loader2, MapPin, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/shared/Input";
import { Location } from "shared/types";
import clsx from "clsx";
import { searchAddress, reverseGeocode } from "@/lib/api/geo";
import { useTheme } from "@/providers/ThemeProvider";
import { FieldError } from "@/components/shared/FieldError";
import { HttpError } from "shared/index";

const markerIcon = L.icon({
  iconUrl: "/assets/pin.svg",
  iconSize: [32, 32],
});

const ClickHandler = ({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const RecenterOnChange = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), 13));
    }
  }, [lat, lng, map]);
  return null;
};

export const LocationPickerMap = ({
  value,
  onChange,
  className,
  disabled = false,
  error,
  onError,
  onInputChange,
}: {
  value: Location;
  onChange?: (location: Location) => void;
  className?: string;
  disabled?: boolean;
  error?: string;
  onError?: (string: string) => void;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const { t } = useTranslation("common");
  const { lang } = useTheme();
  const [query, setQuery] = useState(value.address ?? "");
  const [results, setResults] = useState<Location[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const onErrorRef = useRef(onError);
  const searchControllerRef = useRef<AbortController | null>(null);
  const isSearchingRef = useRef(false);

  useEffect(() => {
    searchControllerRef.current?.abort();
    isSearchingRef.current = false;
    startTransition(() => {
      setIsSearching(false);
      setResults([]);
      setShowResults(false);
    });
  }, [lang]);

  const handleSearch = useCallback(async () => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3 || isSearching) return;

    isSearchingRef.current = true;

    searchControllerRef.current?.abort();

    const controller = new AbortController();
    searchControllerRef.current = controller;

    setIsSearching(true);
    setShowResults(true);
    setResults([]);

    try {
      const items = await searchAddress(trimmedQuery, controller.signal, lang);
      if (!controller.signal.aborted) {
        setResults(items);
      }
    } catch (e) {
      if (!controller.signal.aborted && e instanceof HttpError) {
        onErrorRef.current?.(e.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        isSearchingRef.current = false;
        setIsSearching(false);
      }

      if (searchControllerRef.current === controller) {
        searchControllerRef.current = null;
      }
    }
  }, [query, lang, isSearching]);

  useEffect(() => {
    return () => {
      searchControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    startTransition(() => {
      setQuery(value.address ?? "");
    });
  }, [value.address]);

  const pickResult = (result: Location) => {
    setShowResults(false);
    setResults([]);
    onChange?.(result);
  };

  const handleMapPick = useCallback(
    async (lat: number, lng: number) => {
      setIsResolving(true);
      try {
        const address = await reverseGeocode(lat, lng, undefined, lang);
        if (!address) return;
        onChange?.({ address, lat, lng });
      } catch (e) {
        if (e instanceof HttpError) onErrorRef.current?.(e.message);
      } finally {
        setIsResolving(false);
      }
    },
    [onChange, lang],
  );

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      onErrorRef.current?.("task.location.unsupported");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await handleMapPick(coords.latitude, coords.longitude);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        const messages: Record<number, string> = {
          1: "task.location.denied",
          2: "task.location.unavailable",
          3: "task.location.timeout",
        };
        onErrorRef.current?.(messages[err.code] ?? "task.location.unknown");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [handleMapPick]);

  const hasCoordinates =
    Number.isFinite(value.lat) && Number.isFinite(value.lng);

  const center: [number, number] = hasCoordinates
    ? [value.lat, value.lng]
    : [60.192059, 24.945831];

  if (disabled) {
    return (
      <div className="relative h-56 w-full overflow-hidden border border-border">
        <MapContainer
          {...{ center, zoom: 15, scrollWheelZoom: true }}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {hasCoordinates && (
            <Marker
              position={[value.lat, value.lng]}
              {...{ icon: markerIcon }}
            />
          )}
        </MapContainer>
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col", className)}>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Input
            name="location-search"
            value={query}
            onChange={(e) => {
              onInputChange?.(e);
              setQuery(e.target.value);
              setResults([]);
              setShowResults(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSearch();
              }
            }}
            placeholder={t("location.placeholder")}
            aria-label={t("location.search")}
            error={error}
          />
          {isSearching && (
            <Loader2
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-foreground"
            />
          )}
          {showResults && results.length > 0 && (
            <div className="absolute z-100000 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
              {results.map((result, i) => (
                <button
                  key={`${result.lat}-${result.lng}-${i}`}
                  type="button"
                  onClick={() => pickResult(result)}
                  className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  <MapPin
                    aria-hidden="true"
                    className="w-3.5 h-3.5 mt-0.5 shrink-0 text-foreground"
                  />
                  <span className="line-clamp-2 text-foreground">
                    {result.address}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => void handleSearch()}
          disabled={isSearching || query.trim().length < 3}
          aria-label={t("location.search")}
          className="w-10 h-10 bg-transparent hover:bg-muted"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={locateMe}
          disabled={isLocating || isResolving}
          aria-label={t("location.locate")}
          className="w-10 h-10 bg-transparent hover:bg-muted"
        >
          {isLocating ? (
            <Loader2
              aria-hidden="true"
              className="w-4 h-4 animate-spin text-foreground"
            />
          ) : (
            <LocateFixed
              aria-hidden="true"
              className="w-4 h-4 text-foreground"
            />
          )}
        </Button>
      </div>
      <FieldError message={error} />
      <div className="relative h-56 w-full overflow-hidden border border-border my-2">
        <MapContainer
          {...{ center, zoom: 15, scrollWheelZoom: true }}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onPick={handleMapPick} />
          <RecenterOnChange lat={value.lat} lng={value.lng} />
          {!!value.lat && !!value.lng && (
            <Marker
              position={[value.lat, value.lng]}
              {...{ icon: markerIcon }}
            />
          )}
        </MapContainer>
        {isResolving && (
          <div
            role="status"
            className="absolute top-2 right-2 z-100000 bg-background/90 rounded-full px-2.5 py-1 text-xs text-grey flex items-center gap-1.5 shadow"
          >
            <Loader2
              aria-hidden="true"
              className="w-3 h-3 animate-spin text-foreground"
            />
            {t("location.resolving")}
          </div>
        )}
      </div>
      <p className="text-xs text-grey">{t("location.hint")}</p>
    </div>
  );
};
