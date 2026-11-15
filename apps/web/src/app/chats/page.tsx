import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";
import { ChatsSidebar } from "@/screens/chats/ui/ChatsSidebar";
import { authGuard } from "@/utils/authGuard";
import { getServerApi } from "@/api/server";
import { Lang } from "shared/index";

type SearchParams = Promise<{ chatId?: string }>;

const loadChat = cache(async (id: string) => {
  const api = await getServerApi();
  const [chatRes, messagesRes] = await Promise.all([
    api.getChat(id),
    api.getMessages(id),
  ]);
  return {
    chat: chatRes.data.chat,
    messages: messagesRes.data.items,
    nextCursor: messagesRes.data.nextCursor,
  };
});

export async function generateMetadata() {
  try {
    const cookieStore = await cookies();
    const lang = (cookieStore.get("lang")?.value as Lang) ?? "en";
    return getMetaData({ title: "chats" }, lang);
  } catch {
    return {};
  }
}

export default async function Chats({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { chatId } = await searchParams;
  await authGuard(
    ["tasker", "client", "admin"],
    chatId ? `/chats?chatId=${encodeURIComponent(chatId)}` : "/chats",
  );
  const api = await getServerApi();
  const [chatsRes, opened] = await Promise.all([
    api.getChats(),
    chatId ? loadChat(chatId).catch(() => null) : null,
  ]);
  if (chatId && !opened) redirect("/chats");
  return (
    <ChatsSidebar initialChat={opened?.chat}>
      <main className="page h-full">
        <AutoLogoutPopup />
        <Screens.Chats.Main chats={chatsRes.data.chats} opened={opened} />
      </main>
    </ChatsSidebar>
  );
}
