import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
export const metadata = getMetaData({
  title: "Account",
  description: "Account page",
});

export default async function Account() {
  await authGuard(["tasker", "client", "admin"]);
  return (
    <SidebarWrapper title="Account">
      <main className="page">
        <Screens.User.Account />
      </main>
    </SidebarWrapper>
  );
}
