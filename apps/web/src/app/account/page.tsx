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
        title: "account",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default async function Account() {
  await authGuard(["tasker", "client", "admin"], "/account");
  return (
    <SidebarWrapper title="account">
      <main className="page">
        <AutoLogoutPopup />
        <Screens.User.Account />
      </main>
    </SidebarWrapper>
  );
}
