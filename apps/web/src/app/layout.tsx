import { ReactNode } from "react";
import clsx from "clsx";
import { fonts } from "@/app/fonts";
import { RootLayout } from "@/layouts/RootLayout";
import { getServerApi } from "api/server";
import "@/app/globals.css";
import "@/scss/style.scss";

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.me();
  const { user, settings } = data;
  const lang = user?.settings?.lang || settings?.lang || "en";
  const theme = user?.settings?.theme || settings?.theme || "light";
  return (
    <html
      className={clsx(fonts.map((f) => f.variable))}
      lang={lang}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body>
        <RootLayout initialLang={lang} initialTheme={theme} user={user}>
          {children}
        </RootLayout>
      </body>
    </html>
  );
}
