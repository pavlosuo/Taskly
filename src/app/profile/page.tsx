import { Screens } from "screens";
import { getMetaData } from "utils/Metadata";
import { SidebarWrapper } from "shared/components/AppSidebar";

export const metadata = getMetaData({
  title: "Profile",
  description: "Profile page",
});

export default function Home() {
  return (
    <SidebarWrapper>
      <main className="page">
        <Screens.Profile.Main />
      </main>
    </SidebarWrapper>
  );
}
