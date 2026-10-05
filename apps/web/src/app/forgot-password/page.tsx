import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { redirect } from "next/navigation";
import { getServerApi } from "@/api/server";
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
        title: "forgot-password",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  await authGuard(["guest"], "/forgot-password");
  const { token, error } = await searchParams;
  if (!token) {
    return (
      <main className="page">
        <FloatingSettings />
        <Screens.Auth.ForgotPassword
          error={error as "expired" | "invalid" | "error" | undefined}
        />
      </main>
    );
  }
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.verifyPasswordResetToken(token);
  if (!data.success) {
    redirect(`/forgot-password?error=${data.reason}`);
  }
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Auth.ForgotPassword initialToken={token} />
    </main>
  );
}
