import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authGuard } from "@/utils/authGuard";

export const metadata = getMetaData({
  title: "Register",
  description: "Register page",
});

export default async function Register() {
  await authGuard(["guest"]);
  return (
    <main className="page">
      <Screens.Auth.Register />
    </main>
  );
}
