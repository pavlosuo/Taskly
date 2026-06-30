import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";

export const metadata = getMetaData({
  title: "Admin",
  description: "Administration page",
});

export default function Home() {
  return (
    <SidebarWrapper title="Admin">
      <main className="page">
        <Screens.Admin.Main />
      </main>
    </SidebarWrapper>
  );
}
