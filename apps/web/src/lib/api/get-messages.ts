import { cache } from "react";
import { cookies } from "next/headers";
import { Message } from "@shared/types";
import { BASE_URL } from "api/index";

export const getMessages = cache(
  async (
    id: string,
  ): Promise<{
    messages: Message[] | null;
  }> => {
    try {
      const cookieStore = await cookies();
      const res = await fetch(`${BASE_URL}/api/chats/${id}/messages`, {
        headers: { Cookie: cookieStore.toString() },
        cache: "no-store",
      });
      if (!res.ok)
        return {
          messages: null,
        };
      const data = await res.json();
      return {
        messages: data.data.items ?? null,
      };
    } catch {
      return {
        messages: null,
      };
    }
  },
);
