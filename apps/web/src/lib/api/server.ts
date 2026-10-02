import "server-only";
import { cookies } from "next/headers";
import { createApi, methods } from "@/api/instance";

export async function getServerApi() {
  const cookieStore = await cookies();
  return methods(
    createApi({
      headers: {
        Cookie: cookieStore.toString(),
      },
    }),
  );
}
