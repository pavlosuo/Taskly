import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";
import { getServerApi } from "api/server";

export const metadata = getMetaData({
  title: "Chats",
  description: "Chats page",
});

export default async function Chats() {
  await authGuard(["tasker", "client", "admin"]);
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getChats();
  return (
    <SidebarWrapper title="Chats">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.Chats.Main chats={data.data.chats} />
      </main>
    </SidebarWrapper>
  );
}
