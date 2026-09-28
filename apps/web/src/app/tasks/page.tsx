import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";
import { getServerApi } from "api/server";

export const metadata = getMetaData({
  title: "Tasks",
  description: "Tasks page",
});

export default async function Tasks() {
  const user = await authGuard(["tasker", "client", "admin"]);
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getTasks();
  return (
    <SidebarWrapper title="Tasks">
      <main className="page">
        <AutoLogoutPopup />
        {user?.role === "admin" && <Screens.Tasks.Admin {...data} />}
        {user?.role === "tasker" && <Screens.Tasks.Tasker {...data} />}
        {user?.role === "client" && <Screens.Tasks.Client {...data} />}
      </main>
    </SidebarWrapper>
  );
}
