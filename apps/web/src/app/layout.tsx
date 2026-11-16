import { ReactNode } from "react";
import { fonts } from "@/app/fonts";
import { RootLayout } from "@/layouts/RootLayout";
import { getServerApi } from "@/api/server";
import { Lang, Theme } from "shared/types";
import clsx from "clsx";
import "@/app/globals.css";
import "@/scss/style.scss";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  let lang: Lang = "en";
  let theme: Theme = "light";
  let user = null;
  try {
    const axiosApi = await getServerApi();
    const { data } = await axiosApi.me();
    const { settings } = data;
    user = data.user;
    lang = user?.settings?.lang || settings?.lang;
    theme = user?.settings?.theme || settings?.theme;
  } catch {}
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
