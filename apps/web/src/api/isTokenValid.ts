import { BASE_URL } from "@/api";

type TokenValidResult =
  | { valid: true; reason?: undefined }
  | { valid: false; reason: "expired" | "invalid" | "error" };

export async function isTokenValid(token?: string): Promise<TokenValidResult> {
  if (!token) return { valid: false, reason: "invalid" };
  try {
    const res = await fetch(`${BASE_URL}/api/auth/verify-reset-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) return { valid: true };
    return { valid: false, reason: data.reason ?? "invalid" };
  } catch {
    return { valid: false, reason: "error" };
  }
}
