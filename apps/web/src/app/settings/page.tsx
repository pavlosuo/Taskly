import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { authGuard } from "@/utils/authGuard";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";
import { cookies } from "next/headers";
import { Lang } from "shared/index";

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value as Lang;
    return getMetaData(
      {
        title: "settings",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function Settings() {
  await authGuard(["tasker", "client", "admin"], "/settings");
  return (
    <SidebarWrapper title="settings">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.User.Settings />
      </main>
    </SidebarWrapper>
  );
}
