"use client";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export const SectionLabel = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) => (
  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
    <Icon className="w-3.5 h-3.5" />
    {children}
  </div>
);
