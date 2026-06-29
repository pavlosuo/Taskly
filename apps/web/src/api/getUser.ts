import { cookies } from "next/headers";
import { User } from "root/apps/api/include/types";
import { BASE_URL } from "@/api";

export async function getUser(): Promise<User | null> {
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
}
