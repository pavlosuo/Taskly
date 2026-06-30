"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/User";
import { PublicUser } from "@shared/types";
import { DataProvider } from "@/providers/Data";
import { ClickwrapProvider } from "@/shared/components/Clickwrap";
import { ThemeProvider } from "@/providers/Theme";
import { ModalProvider } from "@/providers/Modal";

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
      <DataProvider initialData={initialData}>
        <UserProvider initialUser={user as PublicUser}>
          <ThemeProvider>
            <ClickwrapProvider>{children}</ClickwrapProvider>
          </ThemeProvider>
        </UserProvider>
      </DataProvider>
    </ModalProvider>
  );
};
