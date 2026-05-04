import { Screens } from "screens";
import { getMetaData } from "utils/Metadata";

export const metadata = getMetaData({
  title: "Admin",
  description: "Administration page",
});

export default function Home() {
  return (
    <main className="page">
      <Screens.Admin.Main />
    </main>
  );
}
