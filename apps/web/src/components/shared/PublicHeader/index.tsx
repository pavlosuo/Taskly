"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/shared/UserDropdown";
import { useUser } from "@/providers/UserProvider";
import { NAV_LINKS, APP_NAME, AccessReason } from "shared/index";
import { Notify } from "@/components/shared/Notify";

export function PublicHeader({
  accessReason = "public",
}: {
  accessReason?: AccessReason;
}) {
  const { t } = useTranslation("common");
  const { user } = useUser();
  const pathname = usePathname();
  return (
    <header className="w-full border-b border-border bg-background sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="logo shrink-0">
            {APP_NAME}
          </Link>
          <nav
            role="navigation"
            className="hidden md:flex items-center gap-1 overflow-x-auto"
          >
            {NAV_LINKS.map((item) => {
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
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {user ? (
            <>
              <Notify />
              <UserDropdown variant="compact" side="top" align="end" />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="secondary" asChild>
                <Link href="/login">{t("header.logIn")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t("header.signUp")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      <nav
        role="navigation"
        className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto"
      >
        {NAV_LINKS.map((item) => {
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
              ? "bg-background text-amber-800 border-foreground"
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
              ? t("header.privateProfileAdmin")
              : t("header.privateProfileOwner")}
          </span>
        </div>
      )}
    </header>
  );
}
