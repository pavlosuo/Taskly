import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { getServerApi } from "@/api/server";
import { authGuard } from "@/utils/authGuard";
import { FloatingSettings } from "@/components/shared/FloatingSettings";
import { cookies } from "next/headers";
import { Lang } from "shared/index";
import { TokenErrorType } from "shared/index";

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
  const { token, error: searchError } = await searchParams;
  let error = searchError as TokenErrorType;
  if (token) {
    try {
      const axiosApi = await getServerApi();
      const { data } = await axiosApi.verifyPasswordResetToken(token);
      if (!data.success) {
        error = "invalid";
      }
    } catch {
      error = "invalid";
    }
  }
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Auth.ForgotPassword
        initialToken={error ? undefined : token}
        error={error}
      />
    </main>
  );
}
