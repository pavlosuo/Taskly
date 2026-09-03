import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authGuard } from "@/utils/authGuard";
import { FloatingSettings } from "@/shared/components/FloatingSettings";

export const metadata = getMetaData({
  title: "Login",
  description: "Login page",
});

export default async function Login() {
  await authGuard(["guest"]);
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Auth.Login />
    </main>
  );
}
