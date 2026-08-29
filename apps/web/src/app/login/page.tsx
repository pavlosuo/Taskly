import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authGuard } from "@/utils/authGuard";

export const metadata = getMetaData({
  title: "Login",
  description: "Login page",
});

export default async function Login() {
  await authGuard(["guest"]);
  return (
    <main className="page">
      <Screens.Auth.Login />
    </main>
  );
}
