import { ReactNode } from "react";
import clsx from "clsx";
import { fonts } from "@/app/fonts";
import { RootLayout } from "@/layouts/RootLayout";
import { getUser } from "api/get-user";
import "@/app/globals.css";
import "@/scss/style.scss";

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user] = await Promise.all([getUser()]);
  const lang = user?.settings?.lang || "en";
  const theme = user?.settings?.theme || "light";
  return (
    <html
      className={clsx(fonts.map((f) => f.variable))}
      lang={lang}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body>
        <RootLayout userJson={user ? JSON.stringify(user) : null}>
          {children}
        </RootLayout>
      </body>
    </html>
  );
}
