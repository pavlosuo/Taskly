import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";
import { getChats } from "@/lib/api/get-chats";

export async function generateMetadata() {
  const { chats } = await getChats();
  if (!chats) return {};
  return getMetaData({
    title:"Chats",
    description: "Chats page",
  });
}

export default async function Chats() {
  await authGuard(["tasker", "client", "admin"]);
  const { chats } = await getChats();
  return (
    <SidebarWrapper
      title={"Chats"}
    >
      <main className="page">
        <AutoLogoutPopup />
        <Screens.Chats.Main chats={chats} />
      </main>
    </SidebarWrapper>
  );
}
