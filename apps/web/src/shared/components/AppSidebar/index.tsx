"use client";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  MessageCircle,
} from "lucide-react";
import { UserDropdown } from "@/shared/components/UserDropdown";
import { useUser } from "@/providers/UserProvider";
import { useMemo } from "react";

export function AppSidebar() {
  const { user } = useUser();

  const navItems = useMemo(() => {
    if (user?.role === "tasker") {
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Post a Task", href: "/post-task", icon: PlusCircle },
        { label: "My Tasks", href: "/tasks", icon: ClipboardList },
        { label: "Chats", href: "/chats", icon: MessageCircle },
      ];
    }
  }, [user]);

  return (
    <Sidebar className="pt-2 pb-2 pl-2 border-none">
      <div className="Sidebar overflow-hidden grid grid-cols-[100%] grid-rows-[max-content_1fr_max-content] p-2 w-full h-full bg-background">
        <Link href="/" className="flex items-center justify-center py-2 mb-4">
          Logo
        </Link>
        <nav>
          <ul className="flex flex-col gap-1">
            {navItems &&
              navItems.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary hover:text-white transition-colors group"
                  >
                    <Icon className="shrink-0 w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
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
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <SidebarProvider className="bg-muted">
      <AppSidebar />
      <div className="flex-1 gap-2 flex flex-col p-2">
        <header className="py-5 px-4 rounded-xl bg-background flex items-center gap-3">
          <SidebarTrigger className="text-foreground hover:bg-primary hover:text-white" />
          <span className="text-sm font-medium">{title}</span>
        </header>
        <div className="flex-1 overflow-hidden bg-background rounded-xl">
          <h1 className="text-2xl font-semibold text-foreground px-4 py-5">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};
