"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { EyeOff, Menu, ShieldAlert, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      ref={headerRef}
      className="w-full border-b border-border bg-background fixed top-0 z-20"
    >
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/" className="logo shrink-0" onClick={closeMenu}>
              {APP_NAME}
            </Link>
            <nav
              role="navigation"
              className="hidden lg:flex items-center gap-1 overflow-x-auto"
            >
              {NAV_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);
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
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="secondary" asChild>
                  <Link href="/login">{t("header.logIn")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{t("header.signUp")}</Link>
                </Button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={
                menuOpen ? t("header.closeMenu") : t("header.openMenu")
              }
              className="lg:hidden p-2 rounded-lg text-grey hover:text-foreground hover:bg-muted transition-colors"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="w-5 h-5" />
              ) : (
                <Menu aria-hidden="true" className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden absolute top-full inset-x-0 border-t border-border bg-background shadow-lg"
          >
            <nav
              role="navigation"
              className="flex flex-col gap-1 px-4 py-3 max-h-[calc(100dvh-4rem)] overflow-y-auto"
            >
              {NAV_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={isActive ? "page" : undefined}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-grey hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {t(item.label)}
                  </Link>
                );
              })}
              {!user && (
                <div className="sm:hidden flex flex-col gap-2 pt-3 mt-2 border-t border-border">
                  <Button variant="secondary" asChild>
                    <Link href="/login" onClick={closeMenu}>
                      {t("header.logIn")}
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register" onClick={closeMenu}>
                      {t("header.signUp")}
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
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
