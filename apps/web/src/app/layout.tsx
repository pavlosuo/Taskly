import { ReactNode } from "react";
import clsx from "clsx";
import { fonts } from "@/app/fonts";
import { RootLayout } from "@/layouts/RootLayout";
import { getUser } from "api/get-user";
import { getPolicyData } from "api/policy";
import "@/app/globals.css";
import "@/scss/style.scss";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, data] = await Promise.all([getUser(), getPolicyData()]);
  const lang = user?.settings?.lang || "en";
  const theme = user?.settings?.theme || "light";
  return (
    <html className={cn(theme, "font-sans", geist.variable)} lang={lang} suppressHydrationWarning>
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
