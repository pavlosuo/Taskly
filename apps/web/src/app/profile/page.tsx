import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";

export const metadata = getMetaData({
  title: "Profile",
  description: "Profile page",
});

export default async function Profile() {
  await authGuard(["tasker", "client"], "/profile");
  return (
    <SidebarWrapper title="Profile">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.User.Profile />
      </main>
    </SidebarWrapper>
  );
}
