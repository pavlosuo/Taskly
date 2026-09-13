import { ReactNode } from "react";
import clsx from "clsx";
import { fonts } from "@/app/fonts";
import { RootLayout } from "@/layouts/RootLayout";
import { getUser } from "api/get-user";
import { getChats } from "@/lib/api/get-chats";
import "@/app/globals.css";
import "@/scss/style.scss";

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, settings } = await getUser();
  const lang = user?.settings?.lang || settings?.lang || "en";
  const theme = user?.settings?.theme || settings?.theme || "light";
  const { chats } = await getChats();
  return (
    <html
      className={clsx(fonts.map((f) => f.variable))}
      lang={lang}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body>
        <RootLayout
          initialLang={lang}
          initialTheme={theme}
          initialChats={chats}
          user={user}
        >
          {children}
        </RootLayout>
      </body>
    </html>
  );
}
