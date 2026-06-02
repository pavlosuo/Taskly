import { ReactNode } from "react";
import clsx from "clsx";
import { fonts } from "@/app/fonts";
import { RootLayout } from "@/layouts/RootLayout";
import { getUser } from "@/api/getUser";
import { getPolicyData } from "@/api/getPolicyData";
import "@/app/globals.css";
import "@/scss/style.scss";

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, data] = await Promise.all([getUser(), getPolicyData()]);
  return (
    <html className="da rk" lang={"en"} suppressHydrationWarning>
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
