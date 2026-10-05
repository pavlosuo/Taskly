import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { getServerApi } from "@/api/server";
import { FloatingSettings } from "@/components/shared/FloatingSettings";
import { cookies } from "next/headers";
import { Lang } from "shared/index";

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value as Lang;
    return getMetaData(
      {
        title: "privacy",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function Privacy() {
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getPolicyData();
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.Privacy.Main data={data.data} />
    </main>
  );
}
