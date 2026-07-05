import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authRedirect } from "@/utils/authRedirect";

export const metadata = getMetaData({
  title: "Admin",
  description: "Administration page",
});

export default async function Admin() {
  await authRedirect("/admin");
  return (
    <SidebarWrapper title="Admin">
      <main className="page">
        <Screens.Admin.Main />
      </main>
    </SidebarWrapper>
  );
}
