import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { authGuard } from "@/utils/authGuard";

export const metadata = getMetaData({
  title: "Privacy Policy",
  description: "Privacy Policy page",
});

export default async function Profile() {
  await authGuard(["guest", "tasker", "client", "admin"]);
  return (
    <main className="page">
      <Screens.User.Profile />
    </main>
  );
}
