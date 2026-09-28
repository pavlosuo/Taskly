"use client";

import type { ReactNode } from "react";

export function SectionCard({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="border border-border bg-background p-4 transition-shadow">
      <div className="w-12 h-12 bg-foreground flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-grey">{desc}</p>
    </div>
  );
}
