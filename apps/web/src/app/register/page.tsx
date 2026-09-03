import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authGuard } from "@/utils/authGuard";
import { FloatingSettings } from "@/shared/components/FloatingSettings";

export const metadata = getMetaData({
  title: "Register",
  description: "Register page",
});

export default async function Register() {
  await authGuard(["guest"]);
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Auth.Register />
    </main>
  );
}
