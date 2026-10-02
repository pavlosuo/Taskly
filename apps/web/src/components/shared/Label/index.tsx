import { Label as LabelPrimitive } from "@/components/ui/label";
import clsx from "clsx";

export function Label({
  children,
  error,
  htmlFor,
}: {
  children: React.ReactNode;
  error?: boolean;
  htmlFor?: string;
}) {
  return (
    <LabelPrimitive
      htmlFor={htmlFor}
      className={clsx(
        "text-sm font-medium mb-1.5 block",
        error ? "text-destructive" : "text-foreground",
      )}
    >
      {children}
    </LabelPrimitive>
  );
}
