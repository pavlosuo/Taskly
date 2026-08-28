import { cache } from "react";
import { cookies } from "next/headers";
import { PublicUser, Lang, Theme } from "@shared/types";
import { BASE_URL } from "api/index";

interface Data {
  user: PublicUser | null;
  settings: { lang: Lang; theme: Theme } | null;
}

export const getUser = cache(async (): Promise<Data> => {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!res.ok)
      return {
        user: null,
        settings: null,
      };
    const data = await res.json();
    return {
      user: data.user ?? null,
      settings: data.settings ?? null,
    };
  } catch {
    return {
      user: null,
      settings: null,
    };
  }
});
