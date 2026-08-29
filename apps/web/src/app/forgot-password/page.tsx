import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { redirect } from "next/navigation";
import { isTokenValid } from "api/verify-reset-token";
import { authGuard } from "@/utils/authGuard";

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
        <Screens.Auth.ForgotPassword
          error={error as "expired" | "invalid" | "error" | undefined}
        />
      </main>
    );
  }
  const result = await isTokenValid(token);
  if (!result.valid) {
    redirect(`/forgot-password?error=${result.reason}`);
  }
  return (
    <main className="page">
      <Screens.Auth.ForgotPassword initialToken={token} />
    </main>
  );
}
