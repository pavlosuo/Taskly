"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/UserProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { MediaPickerProvider } from "@/providers/MediaPickerProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { Lang, Theme, PublicUser } from "shared/types";
import { LightboxProvider } from "@/providers/LightboxProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { PresenceProvider } from "@/providers/PresenceProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TaskProvider } from "@/providers/TaskProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { Toaster } from "@/components/ui/sonner";

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
    <>
      <ThemeProvider initialLang={initialLang} initialTheme={initialTheme}>
        <TooltipProvider>
          <ModalProvider>
            <UserProvider initialUser={user}>
              <SocketProvider>
                <PresenceProvider>
                  <MediaPickerProvider>
                    <NotificationProvider>
                      <ChatProvider>
                        <TaskProvider>
                          <LightboxProvider>{children}</LightboxProvider>
                        </TaskProvider>
                      </ChatProvider>
                    </NotificationProvider>
                  </MediaPickerProvider>
                </PresenceProvider>
              </SocketProvider>
            </UserProvider>
          </ModalProvider>
        </TooltipProvider>
      </ThemeProvider>
      <Toaster />
    </>
  );
};
