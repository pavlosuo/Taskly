import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
export const metadata = getMetaData({
  title: "Profile",
  description: "Profile page",
});

export default async function Profile() {
  await authGuard(["tasker", "client"]);
  return (
    <SidebarWrapper title="Profile">
      <main className="page">
        <Screens.User.Profile />
      </main>
    </SidebarWrapper>
  );
}
