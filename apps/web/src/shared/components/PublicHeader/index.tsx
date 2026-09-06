"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/shared/components/UserDropdown";
import { useUser } from "@/providers/UserProvider";
import { AccessReason } from "@shared/types";
import { navLinks } from "@shared/data";

type Props = {
  accessReason?: AccessReason;
};

const NOTIFICATIONS_COUNT = 1;

export function PublicHeader({ accessReason = "public" }: Props) {
  const { user } = useUser();
  const pathname = usePathname();
  return (
    <header className="w-full border-b border-border bg-background sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="logo shrink-0">
            Taskly
          </Link>
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {navLinks.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-grey hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {user ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative h-10 w-10 rounded-full border-border bg-background shadow-md transition-all hover:scale-105"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {NOTIFICATIONS_COUNT > 0 && (
                  <span className="absolute text-white text-[8px] flex items-center justify-center -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary">
                    {NOTIFICATIONS_COUNT}
                  </span>
                )}
              </Button>
              <UserDropdown variant="compact" side="top" align="end" />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="secondary" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {navLinks.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-grey hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {accessReason !== "public" && (
        <div
          className={`w-full px-4 py-2.5 text-sm flex items-center justify-center gap-2 border-t ${
            accessReason === "admin"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-primary/5 text-primary border-primary/20"
          }`}
        >
          {accessReason === "admin" ? (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          ) : (
            <EyeOff className="w-4 h-4 shrink-0" />
          )}
          <span>
            {accessReason === "admin"
              ? "This profile is private. You can see it because you're signed in as an admin."
              : "This profile is private. You can see it because it's your own profile — other users won't see this page."}
          </span>
        </div>
      )}
    </header>
  );
}
