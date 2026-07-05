import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
export const metadata = getMetaData({
  title: "Register",
  description: "Register page",
});

export default function Register() {
  return (
    <main className="page">
      <Screens.Auth.Register />
    </main>
  );
}
