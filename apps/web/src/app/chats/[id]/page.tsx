import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";
import { authGuard } from "@/utils/authGuard";
import { getChat } from "@/lib/api/get-chat";
import { getMessages } from "@/lib/api/get-messages";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { chat } = await getChat(id);
  if (!chat) return {};
  return getMetaData({
    title: `Chat with ${chat?.member?.fullName}`,
    description: `Your conversation with ${chat?.member?.fullName}`,
  });
}

export default async function Chat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await authGuard(["tasker", "client", "admin"]);
  const { id } = await params;
  const [chatRes, messagesRes] = await Promise.all([
    getChat(id),
    getMessages(id),
  ]);
  const { chat } = chatRes;
  const { messages } = messagesRes;
  if (!chat) notFound();
  return (
    <SidebarWrapper hiddenTitle title={`Chat with ${chat?.member?.fullName}`}>
      <main className="page h-full">
        <AutoLogoutPopup />
        <Screens.Chats.Single chat={chat} messages={messages} />
      </main>
    </SidebarWrapper>
  );
}
