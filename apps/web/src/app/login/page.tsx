import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authRedirect } from "@/utils/authRedirect";
export const metadata = getMetaData({
  title: "Login",
  description: "Login page",
});

export default async function Login() {
  await authRedirect("/login");
  return (
    <main className="page">
      <Screens.Auth.Login />
    </main>
  );
}
