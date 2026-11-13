"use client";
import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import {
  ChevronDown,
  SquareUserRound,
  Settings,
  LogOut,
  ShieldUser,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { PAGES_META } from "shared/data";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/providers/ThemeProvider";
import { useIsMobile } from "@/hooks/useMobile";
import clsx from "clsx";

export const UserDropdown = ({
  side = "top",
  align = "start",
  variant = "default",
}: {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "end";
  variant?: "default" | "compact";
}) => {
  const { user, logout } = useUser();
  const { t } = useTranslation(["user", "common"]);
  const { lang } = useTheme();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      startTransition(() => {
        setOpen(false);
      });
    }
  }, [isMobile]);

  const navItems = (() => {
    if (!user) return null;
    if (user.role === "tasker" || user.role === "client") {
      return [
        {
          label: PAGES_META?.account?.[lang]?.title,
          icon: ShieldUser,
          href: `/account/`,
        },
        {
          label: PAGES_META?.profile?.[lang]?.title,
          icon: SquareUserRound,
          href: `/profile/`,
        },
        {
          label: PAGES_META?.settings?.[lang]?.title,
          icon: Settings,
          href: "/settings",
        },
      ];
    } else if (user.role === "admin") {
      return [
        {
          label: PAGES_META?.account?.[lang]?.title,
          icon: ShieldUser,
          href: `/account/`,
        },
        {
          label: PAGES_META?.settings?.[lang]?.title,
          icon: Settings,
          href: "/settings",
        },
      ];
    }
  })();

  if (!user) return null;

  const avatar = (
    <div className="relative w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-sm font-semibold">
      {user.profile?.avatar ? (
        <ImageDisplay
          src={user.profile.avatar.url}
          alt={user.profile.fullName}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        user.profile?.initials
      )}
    </div>
  );

  const trigger =
    variant === "default" ? (
      <div className="cursor-pointer flex items-center gap-3 p-3 border border-border bg-muted/50 hover:bg-muted transition-colors group mt-4 outline-none">
        {avatar}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-tight">
            {user.username}
          </p>
          <p className="text-xs text-grey truncate capitalize">
            {t(`user:${user.role}`)}
          </p>
        </div>
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </div>
    ) : (
      <div className="cursor-pointer flex items-center transition-colors group outline-none">
        {avatar}
      </div>
    );

  if (isMobile) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {trigger}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm p-0 gap-0">
            <DialogHeader className="p-4 border-b border-border text-left">
              <DialogTitle asChild>
                <div className="flex items-center gap-3">
                  {avatar}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {user.profile?.fullName ?? user.username}
                    </span>
                    <span className="text-xs font-normal text-grey truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col p-2">
              {navItems?.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon size={18} />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={18} />
                <span className="truncate">{t("common:actions.logout")}</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={8}
        className="w-58"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {user.profile?.fullName ?? user.username}
            </span>
            <span className="text-xs text-grey truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {navItems?.length &&
            navItems?.map((item) => (
              <DropdownMenuItem asChild key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 cursor-pointer text-foreground"
                >
                  <item.icon size={15} />
                  <span className="truncate font-normal">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive hover:bg-destructive hover:text-destructive"
        >
          <LogOut size={15} />
          <span className="truncate font-normal">
            {t("common:actions.logout")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
