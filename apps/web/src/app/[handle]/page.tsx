import { notFound } from "next/navigation";
import { getUserForProfilePage } from "@/lib/api/get-user-for-profile-page";
import { getMetaData } from "@/utils/Metadata";
import { Screens } from "@/screens";
import { removeHtml } from "@/utils/removeHtml";
import { truncateForSeo } from "@/utils/truncateForSeo";
import { FloatingSettings } from "@/shared/components/FloatingSettings";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  if (!decoded.startsWith("@")) return {};
  const username = decoded.slice(1);
  const { user } = await getUserForProfilePage(username);
  if (!user) return {};
  return getMetaData({
    title: username,
    description: truncateForSeo(removeHtml(user.publicProfile.bio || "")),
  });
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  if (!decoded.startsWith("@")) notFound();
  const { user, accessReason } = await getUserForProfilePage(decoded.slice(1));
  if (!user) notFound();
  return (
    <main className="page">
      <FloatingSettings />
      <Screens.PublicProfile.Main user={user} accessReason={accessReason} />
    </main>
  );
}
