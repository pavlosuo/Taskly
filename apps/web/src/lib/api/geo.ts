import { Location } from "@shared/types";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

interface Item {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<Location[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Geocoding request failed");

  const data: Item[] = await res.json();
  return data.map((item) => ({
    address: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
  });
  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Reverse geocoding request failed");
  const data = await res.json();
  return data.display_name as string;
}
