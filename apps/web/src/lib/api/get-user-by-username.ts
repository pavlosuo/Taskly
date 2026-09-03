import { PublicProfileUser } from "@shared/types";
import { BASE_URL } from "api/index";
import { cookies } from "next/headers";
import { AccessReason } from "@shared/types";

export const getUserByUsername = async (
  username: string,
): Promise<{
  user: PublicProfileUser | null;
  accessReason: AccessReason;
}> => {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${BASE_URL}/api/profile/get-user-by-username`, {
      method: "POST",
      headers: {
        Cookie: cookieStore.toString(),
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ username }),
    });
    if (!res.ok)
      return {
        user: null,
        accessReason: "public",
      };
    const data = await res.json();
    return data.data;
  } catch {
    return {
      user: null,
      accessReason: "public",
    };
  }
};
