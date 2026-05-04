"use client";
import { FC, PropsWithChildren } from "react";
import { UserProvider } from "@/providers/User";
import { User } from "@/types/index";
import { DataProvider } from "@/providers/Data";
import { ClickwrapProvider } from "@/shared/components/Clickwrap";

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
    <DataProvider initialData={initialData}>
      <UserProvider initialUser={user as User}>
        <ClickwrapProvider>{children}</ClickwrapProvider>
      </UserProvider>
    </DataProvider>
  );
};
