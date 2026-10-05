import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authGuard } from "@/utils/authGuard";
import { FloatingSettings } from "@/components/shared/FloatingSettings";
import { cookies } from "next/headers";
import { Lang } from "shared/index";

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value as Lang;
    return getMetaData(
      {
        title: "login",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function Login() {
  await authGuard(["guest"], "/login");
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Auth.Login />
    </main>
  );
}
