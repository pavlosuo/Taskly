import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";

export const metadata = getMetaData({
  title: "Settings",
  description: "Settings page",
});

export default async function Settings() {
  await authGuard(["tasker", "client", "admin"]);
  return (
    <SidebarWrapper title="Settings">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.User.Settings />
      </main>
    </SidebarWrapper>
  );
}
