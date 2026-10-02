import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authGuard } from "@/utils/authGuard";
import { FloatingSettings } from "@/components/shared/FloatingSettings";

export const metadata = getMetaData({
  title: "Register",
  description: "Register page",
});

export default async function Register() {
  await authGuard(["guest"], "/register");
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Auth.Register />
    </main>
  );
}
