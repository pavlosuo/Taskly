import { ReactNode } from "react";
import clsx from "clsx";
import { fonts } from "@/app/fonts";
import { RootLayout } from "@/layouts/RootLayout";
import { getUser } from "api/get-user";
import { getPolicyData } from "api/policy";
import "@/app/globals.css";
import "@/scss/style.scss";

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, data] = await Promise.all([getUser(), getPolicyData()]);
  const lang = user?.settings?.lang || "en";
  const theme = user?.settings?.theme || "light";
  return (
    <html className={theme} lang={lang} suppressHydrationWarning>
      <body className={clsx(fonts.map((f) => f.variable))}>
        <RootLayout
          initialDataJson={data ? JSON.stringify(data) : null}
          userJson={user ? JSON.stringify(user) : null}
        >
          {children}
        </RootLayout>
      </body>
    </html>
  );
}
