import { Location, Lang } from "shared/types";
import { COUNTRY_CODES_LIST } from "shared/data";

const BASE = "https://nominatim.openstreetmap.org";

interface Item {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    country_code: string;
  };
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
  language: Lang = "en",
): Promise<Location[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "10",
    addressdetails: "1",
  });
  const res = await fetch(`${BASE}/search?${params.toString()}`, {
    signal,
    headers: {
      Accept: "application/json",
      "Accept-Language": language,
    },
  });
  if (!res.ok) {
    throw new Error("task.location.unknown");
  }
  const data: Item[] = await res.json();
  return data
    .filter((item) => {
      return COUNTRY_CODES_LIST.includes(
        item.address?.country_code?.toLowerCase(),
      );
    })
    .map((item) => ({
      address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
  language: Lang = "en",
): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
  });
  const res = await fetch(`${BASE}/reverse?${params.toString()}`, {
    signal,
    headers: {
      Accept: "application/json",
      "Accept-Language": language,
    },
  });
  if (!res.ok) throw new Error("task.location.unknown");
  const data = await res.json();
  if (!COUNTRY_CODES_LIST.includes(data.address?.country_code?.toLowerCase())) {
    throw new Error("task.location.countryNotSupported");
  }
  return data.display_name as string;
}
