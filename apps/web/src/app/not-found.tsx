import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { FloatingSettings } from "@/shared/components/FloatingSettings";

export const metadata = getMetaData({
  title: "Not found",
  description: "Not found page",
});

export default function Page404() {
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Error.Main type="not-found" />
    </main>
  );
}
