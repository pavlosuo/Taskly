import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";
import { getServerApi } from "@/api/server";
import { cookies } from "next/headers";
import { Lang } from "shared/index";

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value as Lang;
    return getMetaData(
      {
        title: "chats",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function Chats() {
  await authGuard(["tasker", "client", "admin"], "/chats");
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getChats();
  return (
    <SidebarWrapper title="chats">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.Chats.Main chats={data.chats} />
      </main>
    </SidebarWrapper>
  );
}
