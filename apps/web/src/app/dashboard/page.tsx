import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { DataProvider } from "@/providers/PolicyDataProvider";
import { getPolicyData } from "@/lib/api/get-policy";

export const metadata = getMetaData({
  title: "Admin Dashboard",
  description: "Admin Dashboard page",
});

export default async function Admin() {
  await authGuard(["admin"]);
  const data = await getPolicyData();
  return (
    <DataProvider initialData={data}>
      <SidebarWrapper title="Dashboard">
        <main className="page">
          <Screens.Admin.Main />
        </main>
      </SidebarWrapper>
    </DataProvider>
  );
}
