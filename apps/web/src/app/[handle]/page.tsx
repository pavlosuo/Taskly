import { notFound } from "next/navigation";
import { getUserByUsername } from "@/lib/api/get-user-by-username";
import { getMetaData } from "@/utils/Metadata";
import parse from "html-react-parser";

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
    description: user.bio,
  });
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  if (!decoded.startsWith("@")) notFound();
  const username = decoded.slice(1);
  const user = await getUserByUsername(username);
  if (!user) notFound();
  return <div className="p-4">{parse(user?.bio || "")}</div>;
}
