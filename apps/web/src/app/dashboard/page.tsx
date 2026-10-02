import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { PolicyDataProvider } from "@/providers/PolicyDataProvider";
import { getServerApi } from "@/api/server";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";

export const metadata = getMetaData({
  title: "Dashboard",
  description: "Dashboard page",
});

export default async function Admin() {
  const user = await authGuard(["admin", "tasker", "client"], "/dashboard");
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getPolicyData();
  if (user?.role === "admin") {
    return (
      <PolicyDataProvider initialPolicyData={data.data}>
        <SidebarWrapper title="Dashboard">
          <main className="page">
            <AutoLogoutPopup />
            <Screens.Admin.Main />
          </main>
        </SidebarWrapper>
      </PolicyDataProvider>
    );
  }
}
