import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";
import { getServerApi } from "@/api/server";
import { cookies } from "next/headers";
import { Lang } from "shared/index";

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value as Lang;
    return getMetaData(
      {
        title: "tasks",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function Tasks() {
  const user = await authGuard(["tasker", "client", "admin"], "/tasks");
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.getTasks({
    page: 1,
    includeMine: true,
  });
  return (
    <SidebarWrapper title="tasks">
      <main className="page">
        <AutoLogoutPopup />
        {user?.role === "admin" && <Screens.Tasks.Admin {...data} />}
        {user?.role === "tasker" && <Screens.Tasks.Tasker {...data} />}
        {user?.role === "client" && <Screens.Tasks.Client {...data} />}
      </main>
    </SidebarWrapper>
  );
}
