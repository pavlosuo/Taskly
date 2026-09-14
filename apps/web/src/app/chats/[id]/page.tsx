import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/shared/components/AppSidebar";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";
import { authGuard } from "@/utils/authGuard";
import { getServerApi } from "api/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const axiosApi = await getServerApi();
    const { data } = await axiosApi.getChat(id);
    const { chat } = data.data;
    if (!chat) return {};
    return getMetaData({
      title: `Chat with ${chat.member.fullName}`,
      description: `Your conversation with ${chat.member.fullName}`,
    });
  } catch {
    return {};
  }
}

export default async function Chat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await authGuard(["tasker", "client", "admin"]);
  const { id } = await params;
  const axiosApi = await getServerApi();
  let chat, messages, nextCursor;
  try {
    const [chatRes, messagesRes] = await Promise.all([
      axiosApi.getChat(id),
      axiosApi.getMessages(id),
    ]);
    chat = chatRes.data.data.chat;
    messages = messagesRes.data.data.items;
    nextCursor = messagesRes.data.data.nextCursor;
  } catch {
    notFound();
  }
  if (!chat) notFound();
  return (
    <SidebarWrapper hiddenTitle title={`Chat with ${chat.member.fullName}`}>
      <main className="page h-full">
        <AutoLogoutPopup />
        <Screens.Chats.Single
          chat={chat}
          messages={messages}
          nextCursor={nextCursor}
        />
      </main>
    </SidebarWrapper>
  );
}