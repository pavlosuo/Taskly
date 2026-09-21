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
import { UserDropdown } from "@/shared/components/UserDropdown";
import { useUser } from "@/providers/UserProvider";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { usePathname } from "next/navigation";
import { Notify } from "@/shared/components/Notify";
import { appName } from "@shared/data";
import clsx from "clsx";

export function AppSidebar() {
  const { user } = useUser();
  const { openPicker } = useMediaPicker();
  const pathname = usePathname();

  const navItems = (() => {
    if (user?.role === "client") {
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "My Tasks", href: "/tasks", icon: ClipboardList },
        { label: "Chats", href: "/chats", icon: MessageCircle },
      ];
    } else if (user?.role === "tasker") {
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "My Tasks", href: "/tasks", icon: ClipboardList },
        { label: "Chats", href: "/chats", icon: MessageCircle },
      ];
    } else if (user?.role === "admin") {
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Stats", href: "/stats", icon: ClipboardList },
        { label: "Support Tickets", href: "/chats", icon: MessageCircle },
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
          {appName}
        </Link>
        <nav>
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
              <span>Media Library</span>
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
}: {
  children: React.ReactNode;
  title: string;
  hiddenTitle?: boolean;
}) => {
  return (
    <SidebarProvider className="bg-muted">
      <AppSidebar />
      <div className="flex-1 gap-2 flex flex-col p-2 h-screen">
        <header className="py-5 px-4 rounded-xl bg-background grid grid-cols-[max-content_1fr_max-content] items-center gap-3">
          <SidebarTrigger className="text-foreground hover:bg-primary hover:text-white" />
          <span className="text-sm font-medium">{title}</span>
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
              {title}
            </h1>
          )}
          <div className="w-full h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
};
