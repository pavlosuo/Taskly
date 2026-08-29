import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";

export const metadata = getMetaData({
  title: "Admin",
  description: "Administration page",
});

export default async function Admin() {
  await authGuard(["admin"]);
  return (
    <SidebarWrapper title="Admin">
      <main className="page">
        <Screens.Admin.Main />
      </main>
    </SidebarWrapper>
  );
}
