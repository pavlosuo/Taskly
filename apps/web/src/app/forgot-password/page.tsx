import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { redirect } from "next/navigation";
import { getServerApi } from "api/server";
import { authGuard } from "@/utils/authGuard";
import { FloatingSettings } from "@/shared/components/FloatingSettings";

export const metadata = getMetaData({
  title: "Forgot Password",
  description: "Forgot Password page",
});

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  await authGuard(["guest"]);
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
