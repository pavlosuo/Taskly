import { notFound } from "next/navigation";
import { getUserByUsername } from "@/lib/api/get-user-by-username";
import { getMetaData } from "@/utils/Metadata";
import { Screens } from "@/screens";
import { removeHtml } from "@/utils/removeHtml";
import { truncateForSeo } from "@/utils/truncateForSeo";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  if (!decoded.startsWith("@")) return {};
  const username = decoded.slice(1);
  const user = await getUserByUsername(username);
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
  const user = await getUserByUsername(decoded.slice(1));
  if (!user) notFound();
  return (
    <main className="page">
      <Screens.PublicProfile.Main user={user} />
    </main>
  );
}
