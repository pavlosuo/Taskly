import { ServiceResult } from "@shared/types";

const BASE = "https://nominatim.openstreetmap.org";

const headers = {
  Accept: "application/json",
  "User-Agent": "YourAppName/1.0 (your-email@example.com)",
};

interface Item {
  display_name: string;
  lat: string;
  lon: string;
}

export class GeocodingService {
  async searchAddress(query: string): Promise<ServiceResult> {
    try {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        return {
          success: false,
          status: 400,
          message: "Invalid query.",
        };
      }

      const params = new URLSearchParams({
        q: trimmedQuery,
        format: "jsonv2",
        limit: "5",
      });

      const res = await fetch(`${BASE}/search?${params}`, {
        headers,
      });

      if (!res.ok) {
        const body = await res.text();

        console.error("Nominatim search error:", {
          status: res.status,
          statusText: res.statusText,
          body,
        });

        return {
          success: false,
          status: res.status,
          message: "Geocoding request failed.",
        };
      }

      const data = (await res.json()) as Item[];

      return {
        success: true,
        status: 200,
        data: {
          items: data.map((item) => ({
            address: item.display_name,
            lat: Number(item.lat),
            lng: Number(item.lon),
          })),
        },
      };
    } catch (error) {
      console.error("Geocoding error:", error);

      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<ServiceResult> {
    try {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return {
          success: false,
          status: 400,
          message: "Invalid coordinates.",
        };
      }

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
      });

      const res = await fetch(`${BASE}/reverse?${params}`, {
        headers,
      });

      if (!res.ok) {
        const body = await res.text();

        console.error("Nominatim reverse error:", {
          status: res.status,
          statusText: res.statusText,
          body,
        });

        return {
          success: false,
          status: res.status,
          message: "Reverse geocoding request failed.",
        };
      }

      const data = (await res.json()) as Item;

      return {
        success: true,
        status: 200,
        data: {
          name: data.display_name,
        },
      };
    } catch (error) {
      console.error("Geocoding error:", error);

      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }
}
