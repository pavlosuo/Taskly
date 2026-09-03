import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { DataProvider } from "@/providers/PolicyDataProvider";
import { getPolicyData } from "@/lib/api/get-policy";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";

export const metadata = getMetaData({
  title: "Dashboard",
  description: "Dashboard page",
});

export default async function Admin() {
  const user = await authGuard(["admin", "tasker", "client"]);
  const data = await getPolicyData();
  if (user?.role === "admin") {
    return (
      <DataProvider initialData={data}>
        <SidebarWrapper title="Dashboard">
          <main className="page">
            <AutoLogoutPopup />
            <Screens.Admin.Main />
          </main>
        </SidebarWrapper>
      </DataProvider>
    );
  }
}
