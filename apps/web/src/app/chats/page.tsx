import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";

export const metadata = getMetaData({
  title: "Chats",
  description: "Chats page",
});

export default async function Chats() {
  await authGuard(["tasker", "client", "admin"]);
  return (
    <SidebarWrapper title="Chats">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.Chats.Main />
      </main>
    </SidebarWrapper>
  );
}
