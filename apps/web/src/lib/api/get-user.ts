import { cache } from "react";
import { cookies } from "next/headers";
import { PublicUser } from "@shared/types";
import { BASE_URL } from "api/index";

export const getUser = cache(async (): Promise<PublicUser | null> => {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
});
