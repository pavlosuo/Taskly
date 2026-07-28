"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/UserProvider";
import { DataProvider } from "@/providers/PolicyDataProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { MediaPickerProvider } from "@/providers/MediaPickerProvider";

type IRootLayout = {
  userJson: string | null;
  initialDataJson: string | null;
};

export const RootLayout: FC<PropsWithChildren<IRootLayout>> = ({
  children,
  userJson,
  initialDataJson,
}) => {
  const user = userJson ? JSON.parse(userJson) : null;
  const initialData = initialDataJson ? JSON.parse(initialDataJson) : null;
  return (
    <ModalProvider>
      <MediaPickerProvider>
        <DataProvider initialData={initialData}>
          <UserProvider initialUser={user}>
            <ThemeProvider initialUser={user}>{children}</ThemeProvider>
          </UserProvider>
        </DataProvider>
      </MediaPickerProvider>
    </ModalProvider>
  );
};
