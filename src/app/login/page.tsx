import { Screens } from "screens";
import { getMetaData } from "utils/Metadata";
export const metadata = getMetaData({
  title: "Login",
  description: "Login page",
});

export default function Login() {
  return (
    <main className="page">
      <Screens.Auth.Login />
    </main>
  );
}
