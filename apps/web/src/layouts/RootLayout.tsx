"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/UserProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { MediaPickerProvider } from "@/providers/MediaPickerProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { Lang, Theme, PublicUser } from "@shared/types";
import { LightboxProvider } from "@/providers/LightboxProvider";

type IRootLayout = {
  user: PublicUser | null;
  initialLang: Lang;
  initialTheme: Theme;
};

export const RootLayout: FC<PropsWithChildren<IRootLayout>> = ({
  children,
  user,
  initialLang,
  initialTheme,
}) => {
  return (
    <ModalProvider>
      <UserProvider initialUser={user}>
        <ThemeProvider initialLang={initialLang} initialTheme={initialTheme}>
          <MediaPickerProvider>
            <ChatProvider>
              <LightboxProvider>{children}</LightboxProvider>
            </ChatProvider>
          </MediaPickerProvider>
        </ThemeProvider>
      </UserProvider>
    </ModalProvider>
  );
};
