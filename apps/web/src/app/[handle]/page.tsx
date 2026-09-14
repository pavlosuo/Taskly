import { notFound } from "next/navigation";
import { getMetaData } from "@/utils/Metadata";
import { Screens } from "@/screens";
import { removeHtml } from "@/utils/removeHtml";
import { truncateForSeo } from "@/utils/truncateForSeo";
import { FloatingSettings } from "@/shared/components/FloatingSettings";
import { getServerApi } from "api/server";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props) {
  try {
    const { handle } = await params;
    const decoded = decodeURIComponent(handle);
    if (!decoded.startsWith("@")) return {};
    const username = decoded.slice(1);
    const axiosApi = await getServerApi();
    const { data } = await axiosApi.getUserForProfilePage(username);
    const { user } = data;
    if (!user) return {};
    return getMetaData({
      title: username,
      description: truncateForSeo(removeHtml(user.publicProfile.bio || "")),
    });
  } catch {
    return {};
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  if (!decoded.startsWith("@")) notFound();
  const axiosApi = await getServerApi();
  let user, accessReason;
  try {
    const { data } = await axiosApi.getUserForProfilePage(decoded.slice(1));
    user = data.user;
    accessReason = data.accessReason;
  } catch {
    notFound();
  }
  if (!user) notFound();
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.PublicProfile.Main user={user} accessReason={accessReason} />
    </main>
  );
}
