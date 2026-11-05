import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { FloatingSettings } from "@/components/shared/FloatingSettings";
import { cookies } from "next/headers";
import { Lang } from "shared/index";

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("lang")?.value as Lang;
    return getMetaData(
      {
        title: "not-found",
      },
      lang,
    );
  } catch {
    return {};
  }
}

export default function Page404() {
  return (
    <>
      <FloatingSettings />
      <Screens.Error.Main type="not-found" />
    </>
  );
}
