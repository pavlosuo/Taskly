"use client";
import clsx from "clsx";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function Field({
  label,
  value,
  badge,
  badgeOk,
  onVerify,
}: {
  label: string;
  value: string;
  badge?: string;
  badgeOk?: boolean;
  onVerify?: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-grey mb-1">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-foreground truncate">{value}</p>
        {badge && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              badgeOk
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-warning/10 text-warning",
            )}
          >
            {badgeOk ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {badge}
          </span>
        )}
        {onVerify && (
          <button
            onClick={onVerify}
            className="text-[11px] font-medium text-primary hover:underline underline-offset-2"
          >
            Verify now
          </button>
        )}
      </div>
    </div>
  );
}
