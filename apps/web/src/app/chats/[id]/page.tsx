import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { AutoLogoutPopup } from "@/components/shared/AutoLogoutPopup";
import { authGuard } from "@/utils/authGuard";
import { getServerApi } from "@/api/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Lang, CHAT_PAGE_META, APP_NAME } from "shared/index";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const axiosApi = await getServerApi();
    const { data } = await axiosApi.getChat(id);
    const { chat } = data;
    if (!chat) return {};
    const cookieStore = await cookies();
    const lang = (cookieStore.get("lang")?.value as Lang) ?? "en";
    const texts = CHAT_PAGE_META[lang];
    const name = chat.member.fullName;
    return getMetaData(
      {
        title: texts.title(name),
        description: texts.description(name),
      },
      lang,
    );
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
    chat = chatRes.data.chat;
    messages = messagesRes.data.items;
    nextCursor = messagesRes.data.nextCursor;
  } catch {
    notFound();
  }
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "en";
  const texts = CHAT_PAGE_META[lang];
  const name = chat.member.fullName;
  if (!chat) notFound();
  return (
    <SidebarWrapper
      hiddenTitle
      title={texts.title(name) + " | " + APP_NAME}
      memberName={name}
    >
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
