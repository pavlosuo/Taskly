"use client";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  MessageCircle,
  ImagePlus,
} from "lucide-react";
import { UserDropdown } from "@/components/shared/UserDropdown";
import { useUser } from "@/providers/UserProvider";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { usePathname } from "next/navigation";
import { Notify } from "@/components/shared/Notify";
import { APP_NAME, PAGES_META, CHAT_PAGE_META } from "shared/data";
import clsx from "clsx";
import { useTheme } from "@/providers/ThemeProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { WalletDialog } from "@/components/shared/WalletDialog";

export function AppSidebar() {
  const { user } = useUser();
  const { openPicker } = useMediaPicker();
  const pathname = usePathname();
  const { lang } = useTheme();
  const { t } = useTranslation(["media"]);

  const navItems = (() => {
    if (user?.role === "client") {
      return [
        {
          label: PAGES_META?.["dashboard"]?.[lang]?.title,
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: PAGES_META?.["tasks"]?.[lang]?.title,
          href: "/tasks",
          icon: ClipboardList,
        },
        {
          label: PAGES_META?.["chats"]?.[lang]?.title,
          href: "/chats",
          icon: MessageCircle,
        },
      ];
    } else if (user?.role === "tasker") {
      return [
        {
          label: PAGES_META?.["dashboard"]?.[lang]?.title,
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: PAGES_META?.["tasks"]?.[lang]?.title,
          href: "/tasks",
          icon: ClipboardList,
        },
        {
          label: PAGES_META?.["chats"]?.[lang]?.title,
          href: "/chats",
          icon: MessageCircle,
        },
      ];
    } else if (user?.role === "admin") {
      return [
        {
          label: PAGES_META?.["dashboard"]?.[lang]?.title,
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: PAGES_META?.["stats"]?.[lang]?.title,
          href: "/stats",
          icon: ClipboardList,
        },
        {
          label: PAGES_META?.["chats"]?.[lang]?.title,
          href: "/chats",
          icon: MessageCircle,
        },
      ];
    }
  })();

  return (
    <Sidebar className="pt-2 pb-2 pl-2 border-none">
      <div className="Sidebar overflow-hidden grid grid-cols-[100%] grid-rows-[max-content_1fr_max-content] p-2 w-full h-full bg-background">
        <Link
          href="/"
          className="py-2 mb-4 logo flex items-center justify-center"
        >
          {APP_NAME}
        </Link>
        <nav role="navigation">
          <ul className="flex flex-col gap-1">
            {navItems &&
              navItems.map(({ label, href, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname?.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={clsx(
                        "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                        "font-medium text-foreground hover:bg-primary hover:text-white transition-colors group",
                        isActive && "bg-primary text-white",
                      )}
                    >
                      <Icon className="shrink-0 w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            <button
              type="button"
              onClick={() => openPicker({})}
              className={clsx(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                "font-medium text-foreground hover:bg-primary hover:text-white transition-colors group",
              )}
            >
              <ImagePlus className="shrink-0 w-4 h-4" />
              <span>{t("title")}</span>
            </button>
          </ul>
        </nav>
        <UserDropdown />
      </div>
    </Sidebar>
  );
}

export const SidebarWrapper = ({
  children,
  title,
  hiddenTitle,
  memberName,
}: {
  children: React.ReactNode;
  title: string;
  hiddenTitle?: boolean;
  memberName?: string;
}) => {
  const { lang } = useTheme();
  const { t } = useTranslation("chats");
  const fullName =
    memberName === "user.deleted"
      ? t("list.deletedUser")
      : CHAT_PAGE_META[lang].title(memberName || "");
  const formattedTitle = memberName
    ? fullName
    : PAGES_META?.[title]?.[lang]?.title || title;
  return (
    <SidebarProvider className="bg-muted">
      <AppSidebar />
      <div className="flex-1 gap-2 flex flex-col p-2 h-screen">
        <header className="py-5 px-4 rounded-xl bg-background grid grid-cols-[max-content_1fr_max-content_max-content] items-center gap-3">
          <SidebarTrigger className="text-foreground hover:bg-primary hover:text-white" />
          <span className="text-sm font-medium">{formattedTitle}</span>
          <WalletDialog />
          <Notify />
        </header>
        <div
          className={clsx(
            "flex-1 overflow-hidden h-full bg-background rounded-xl grid grid-cols-1",
            hiddenTitle ? "grid-rows-[100%]" : "grid-rows-[max-content_1fr]",
          )}
        >
          {!hiddenTitle && (
            <h1 className="text-2xl font-semibold text-foreground px-4 py-5">
              {formattedTitle}
            </h1>
          )}
          <div className="w-full h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
};
