import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";

export const metadata = getMetaData({
  title: "Account",
  description: "Account page",
});

export default async function Account() {
  await authGuard(["tasker", "client", "admin"], "/account");
  return (
    <SidebarWrapper title="Account">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.User.Account />
      </main>
    </SidebarWrapper>
  );
}
