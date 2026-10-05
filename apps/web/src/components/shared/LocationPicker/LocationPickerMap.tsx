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
import { Search, Loader2, MapPin, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/shared/Input";
import { Location } from "shared/types";
import clsx from "clsx";
import { searchAddress, reverseGeocode } from "@/lib/api/geo";
import { useTheme } from "@/providers/ThemeProvider";
import { FieldError } from "@/components/shared/FieldError";

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
    if (lat && lng) {
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
}: {
  value: Location;
  onChange?: (location: Location) => void;
  className?: string;
  disabled?: boolean;
  error?: string;
  onError?: (string: string) => void;
}) => {
  const { lang } = useTheme();
  const [query, setQuery] = useState(value.address ?? "");
  const [results, setResults] = useState<Location[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setQuery(value.address ?? "");
    });
  }, [value.address]);

  useEffect(() => {
    if (!showResults) return;
    abortRef.current?.abort();
    if (query.trim().length < 3) {
      startTransition(() => {
        setResults([]);
      });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    startTransition(() => {
      setIsSearching(true);
    });
    const timeout = setTimeout(async () => {
      try {
        const items = await searchAddress(query, controller.signal, lang);
        setResults(items);
      } catch (e) {
        if (e instanceof Error) {
          onError?.(e?.message);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, showResults, lang, onError]);

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
        if (e instanceof Error) {
          onError?.(e?.message);
        }
      } finally {
        setIsResolving(false);
      }
    },
    [onChange, lang, onError],
  );

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      onError?.("task.location.unsupported");
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
        onError?.(messages[err.code] ?? "task.location.unknown");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [handleMapPick, onError]);

  if (disabled) {
    return (
      <div className="relative h-56 w-full overflow-hidden border border-border">
        <MapContainer
          {...{
            center:
              value.lat && value.lng
                ? [value.lat, value.lng]
                : [60.192059, 24.945831],
            zoom: 15,
            scrollWheelZoom: true,
          }}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {!!value.lat && !!value.lng && (
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            name="location-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            placeholder="Search for an address..."
            className="pl-9 pr-9"
            error={error}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
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
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{result.address}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={locateMe}
          disabled={isLocating || isResolving}
          className="w-10 h-10"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
        </Button>
      </div>
      <FieldError message={error} />
      <div className="relative h-56 w-full overflow-hidden border border-border my-2">
        <MapContainer
          {...{
            center:
              value.lat && value.lng
                ? [value.lat, value.lng]
                : [60.192059, 24.945831],
            zoom: 15,
            scrollWheelZoom: true,
          }}
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
          <div className="absolute top-2 right-2 z-100000 bg-background/90 rounded-full px-2.5 py-1 text-xs text-muted-foreground flex items-center gap-1.5 shadow">
            <Loader2 className="w-3 h-3 animate-spin" />
            Resolving address...
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Click the map to drop a pin, or search an address above · Powered by
        OpenStreetMap
      </p>
    </div>
  );
};
