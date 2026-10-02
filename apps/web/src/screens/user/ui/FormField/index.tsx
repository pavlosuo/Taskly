"use client";
import { ReactNode } from "react";
import { Label } from "@/components/shared/Label";
import { FieldError } from "@/components/shared/FieldError";

export function FormField({
  label,
  hint,
  children,
  error,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  error?: string;
  htmlFor?: string;
}) {
  return (
    <div className="form-group">
      <Label error={!!error} htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      <FieldError message={error} />
      {!error && <FieldError message={hint} hint />}
    </div>
  );
}
