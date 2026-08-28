import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";

export const metadata = getMetaData({
  title: "Not found",
  description: "Not found page",
});

export default function Page404() {
  return (
    <main className="page">
      <Screens.Page404.Main />
    </main>
  );
}
