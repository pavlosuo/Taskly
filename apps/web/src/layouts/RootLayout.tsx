"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/UserProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { MediaPickerProvider } from "@/providers/MediaPickerProvider";

type IRootLayout = {
  userJson: string | null;
};

export const RootLayout: FC<PropsWithChildren<IRootLayout>> = ({
  children,
  userJson,
}) => {
  const user = userJson ? JSON.parse(userJson) : null;
  return (
    <ModalProvider>
      <MediaPickerProvider>
        <UserProvider initialUser={user}>
          <ThemeProvider initialUser={user}>{children}</ThemeProvider>
        </UserProvider>
      </MediaPickerProvider>
    </ModalProvider>
  );
};
