"use client";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-group">
      <Label className="text-sm font-medium mb-1.5 block text-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-warning mt-1.5">{hint}</p>}
    </div>
  );
}
