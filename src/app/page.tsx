import { Screens } from "screens";
import { getMetaData } from "utils/Metadata";
export const metadata = getMetaData({
  title: "Home",
  description: "Home page",
});

export default function Home() {
  return (
    <main className="page">
      <Screens.Main.Main />
    </main>
  );
}
