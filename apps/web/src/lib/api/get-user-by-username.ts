import { cache } from "react";
import { PublicProfileUser } from "@shared/types";
import { BASE_URL } from "api/index";

export const getUserByUsername = cache(
  async (username: string): Promise<PublicProfileUser | null> => {
    try {
      const res = await fetch(`${BASE_URL}/api/profile/get-user-by-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data.user ?? null;
    } catch {
      return null;
    }
  },
);
