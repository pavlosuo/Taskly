import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";

export const metadata = getMetaData({
  title: "Settings",
  description: "Settings page",
});

export default async function Settings() {
  await authGuard(["tasker", "client", "admin"]);
  return (
    <SidebarWrapper title="Settings">
      <main className="page">
        <Screens.User.Settings />
      </main>
    </SidebarWrapper>
  );
}
