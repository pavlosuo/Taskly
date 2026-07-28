"use client";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { useMemo } from "react";
import {
  ChevronDown,
  SquareUserRound,
  Settings,
  HelpCircle,
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
import { ImageDisplay } from "@/shared/components/MediaPicker";

export const UserDropdown = () => {
  const { user, logout } = useUser();

  const menuItems = useMemo(() => {
    if (!user) return null;
    if (user.role === "tasker") {
      return [
        {
          label: "Account",
          icon: ShieldUser,
          href: `/account/`,
        },
        {
          label: "Profile",
          icon: SquareUserRound,
          href: `/profile/`,
        },
        {
          label: "Settings",
          icon: Settings,
          href: "/settings",
        },
        {
          label: "Help",
          icon: HelpCircle,
          href: "/help",
        },
      ];
    }
  }, [user]);

  if (!user) return null;

  const initials = user.profile?.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors group mt-4 outline-none">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-sm font-semibold">
            {user.profile?.avatar ? (
              <ImageDisplay
                src={user.profile.avatar}
                alt={user.profile.fullName}
                className="rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {user.username}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {user.role}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-58"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {user.profile?.fullName ?? user.username}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems?.length &&
            menuItems?.map((item) => (
              <DropdownMenuItem asChild key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 cursor-pointer text-red focus:text-red focus:bg-red/10 hover:bg-red hover:text-red"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
