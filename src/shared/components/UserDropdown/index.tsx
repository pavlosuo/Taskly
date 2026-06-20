"use client";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "providers/User";
import { ChevronDown, User, Settings, HelpCircle, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const UserDropdown = () => {
  const { user, logout } = useUser();
  if (!user) return null;

  const initials = user.profile?.fullName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors group mt-4 outline-none">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-sm font-semibold">
            {user.profile?.avatar ? (
              <Image
                src={user.profile.avatar}
                alt={user.username}
                width={36}
                height={36}
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
            <p className="text-xs text-muted-foreground truncate">
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
        className="w-58 bg-background border border-muted shadow-md"
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
          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="flex items-center gap-2 cursor-pointer hover:text-foreground hover:bg-muted"
            >
              <User className="text-[currentColor]" size={15} />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/settings"
              className="flex items-center gap-2 cursor-pointer hover:text-foreground hover:bg-muted"
            >
              <Settings className="text-[currentColor]" size={15} />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/help"
              className="flex items-center gap-2 cursor-pointer hover:text-foreground hover:bg-muted"
            >
              <HelpCircle className="text-[currentColor]" size={15} />
              Help
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer hover:text-foreground hover:bg-muted"
        >
          <LogOut className="text-[currentColor]" size={15} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
