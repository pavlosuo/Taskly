"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/UserProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { MediaPickerProvider } from "@/providers/MediaPickerProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { Lang, Theme, ChatWithMember, PublicUser } from "@shared/types";

type IRootLayout = {
  user: PublicUser | null;
  initialLang: Lang;
  initialTheme: Theme;
  initialChats: ChatWithMember[];
};

export const RootLayout: FC<PropsWithChildren<IRootLayout>> = ({
  children,
  user,
  initialLang,
  initialTheme,
  initialChats,
}) => {
  return (
    <ModalProvider>
      <UserProvider initialUser={user}>
        <ThemeProvider initialLang={initialLang} initialTheme={initialTheme}>
          <MediaPickerProvider>
            <ChatProvider initialChats={initialChats}>{children}</ChatProvider>
          </MediaPickerProvider>
        </ThemeProvider>
      </UserProvider>
    </ModalProvider>
  );
};
