import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authRedirect } from "@/utils/authRedirect";

export const metadata = getMetaData({
  title: "Profile",
  description: "Profile page",
});

export default async function Profile() {
  await authRedirect("/profile");
  return (
    <SidebarWrapper title="Profile">
      <main className="page">
        <Screens.Profile.Main />
      </main>
    </SidebarWrapper>
  );
}
