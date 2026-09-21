import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { getServerApi } from "api/server";
import { FloatingSettings } from "@/shared/components/FloatingSettings";

export const metadata = getMetaData({
  title: "Privacy",
  description: "Privacy page",
});

export default async function Profile() {
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getPolicyData();
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Privacy.Main data={data.data} />
    </main>
  );
}
