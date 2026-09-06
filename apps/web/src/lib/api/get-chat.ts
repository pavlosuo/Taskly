import { cache } from "react";
import { cookies } from "next/headers";
import { ChatWithMember } from "@shared/types";
import { BASE_URL } from "api/index";

export const getChat = cache(
  async (
    id: string,
  ): Promise<{
    chat: ChatWithMember | null;
  }> => {
    try {
      const cookieStore = await cookies();
      const res = await fetch(`${BASE_URL}/api/chats/${id}`, {
        headers: { Cookie: cookieStore.toString() },
        cache: "no-store",
      });
      if (!res.ok)
        return {
          chat: null,
        };
      const data = await res.json();
      return {
        chat: data.data.chat ?? null,
      };
    } catch {
      return {
        chat: null,
      };
    }
  },
);
