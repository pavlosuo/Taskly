"use client";
import { ReactNode } from "react";

export function SpanField({
  text,
  subtext,
  icon,
}: {
  text: string;
  subtext?: string;
  icon?: ReactNode;
}) {
  if (!text) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">
      {icon}
      <span>
        {text}
        {subtext && (
          <span className="text-[10px] text-grey font-normal ml-1.5">
            {subtext}
          </span>
        )}
      </span>
    </span>
  );
}
