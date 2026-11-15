"use client";
import { FC, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { SidebarWrapper } from "@/components/shared/AppSidebar";
import { useChats } from "@/providers/ChatProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { CHAT_PAGE_META, APP_NAME } from "shared/index";
import { ChatWithMember } from "shared/types";

export const ChatsSidebar: FC<{
  children: ReactNode;
  initialChat?: ChatWithMember;
}> = ({ children, initialChat }) => {
  const { t } = useTranslation("chats");
  const { lang } = useTheme();
  const { chats } = useChats();
  const chatId = useSearchParams().get("chatId");
  const chat =
    (chatId ? chats.find((c) => c._id === chatId) : undefined) ??
    (initialChat && initialChat._id === chatId ? initialChat : undefined);
  if (!chat) {
    return <SidebarWrapper title="chats">{children}</SidebarWrapper>;
  }
  const name =
    chat.member.fullName === "user.deleted"
      ? t("list.deletedUser")
      : chat.member.fullName;
  return (
    <SidebarWrapper
      hiddenTitle
      title={CHAT_PAGE_META[lang].title(name) + " | " + APP_NAME}
      memberName={name}
    >
      {children}
    </SidebarWrapper>
  );
};
