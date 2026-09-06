import { cache } from "react";
import { cookies } from "next/headers";
import { ChatWithMember } from "@shared/types";
import { BASE_URL } from "api/index";

export const getChats = cache(
  async (): Promise<{
    chats: ChatWithMember[] | null;
  }> => {
    try {
      const cookieStore = await cookies();
      const res = await fetch(`${BASE_URL}/api/chats`, {
        headers: { Cookie: cookieStore.toString() },
        cache: "no-store",
      });
      if (!res.ok)
        return {
          chats: null,
        };
      const data = await res.json();
      return {
        chats: data.data.chats ?? null,
      };
    } catch {
      return {
        chats: null,
      };
    }
  },
);
