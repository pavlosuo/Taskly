import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { getPolicyData } from "@/lib/api/get-policy";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";

export const metadata = getMetaData({
  title: "Privacy",
  description: "Privacy page",
});

export default async function Profile() {
  const data = await getPolicyData();
  return (
    <main className="page">
      <AutoLogoutPopup />
      <Screens.Privacy.Main data={data} />
    </main>
  );
}
