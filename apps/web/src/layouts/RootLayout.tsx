"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/UserProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { MediaPickerProvider } from "@/providers/MediaPickerProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { Lang, Theme } from "@shared/types";

type IRootLayout = {
  userJson: string | null;
  initialLang: Lang;
  initialTheme: Theme;
};

export const RootLayout: FC<PropsWithChildren<IRootLayout>> = ({
  children,
  userJson,
  initialLang,
  initialTheme,
}) => {
  return (
    <ModalProvider>
      <UserProvider initialUser={userJson ? JSON.parse(userJson) : null}>
        <ThemeProvider initialLang={initialLang} initialTheme={initialTheme}>
          <MediaPickerProvider>
            <ChatProvider>{children}</ChatProvider>
          </MediaPickerProvider>
        </ThemeProvider>
      </UserProvider>
    </ModalProvider>
  );
};
