import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { PolicyDataProvider } from "@/providers/PolicyDataProvider";
import { getServerApi } from "@/api/server";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";
import { cookies } from "next/headers";
import { Lang } from "shared/index";

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value as Lang;
    return getMetaData(
      {
        title: "dashboard",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function Dashboard() {
  const user = await authGuard(["admin", "tasker", "client"], "/dashboard");
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getPolicyData();
  if (user?.role === "admin") {
    return (
      <PolicyDataProvider initialPolicyData={data.data}>
        <SidebarWrapper title="dashboard">
          <main className="page">
            <AutoLogoutPopup />
            <Screens.Admin.Main />
          </main>
        </SidebarWrapper>
      </PolicyDataProvider>
    );
  }
}
