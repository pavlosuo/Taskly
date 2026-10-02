import { AlertCircle } from "lucide-react";
import clsx from "clsx";

export function FieldError({
  message,
  icon,
  hint,
}: {
  message?: string;
  icon?: boolean;
  hint?: boolean;
}) {
  if (!message) return null;
  return (
    <p
      className={clsx(
        "text-xs mt-1",
        icon && "flex items-center",
        hint ? "text-warning" : "text-destructive",
      )}
    >
      {icon && <AlertCircle className="w-4 h-4 inline-block mr-1" />}
      {message}
    </p>
  );
}
