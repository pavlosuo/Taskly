import { AlertCircle } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/hooks/useTranslation";

export function FieldError({
  message,
  icon,
  hint,
  className,
  values,
  ...props
}: {
  message?: string;
  icon?: boolean;
  hint?: boolean;
  values?: Record<string, unknown>;
  className?: string;
} & React.ComponentProps<"p">) {
  const { t } = useTranslation("errors");
  if (!message) return null;
  return (
    <p
      className={clsx(
        "text-xs mt-1",
        icon && "flex items-center",
        hint ? "text-warning" : "text-destructive",
        className,
      )}
      {...props}
    >
      {icon && <AlertCircle className="w-4 h-4 inline-block mr-1" />}
      {t(message, values)}
    </p>
  );
}
