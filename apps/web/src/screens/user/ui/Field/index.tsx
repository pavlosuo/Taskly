"use client";
import clsx from "clsx";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("profile");
  return (
    <div>
      <p className="text-xs text-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-foreground truncate">{value}</p>
        {badge && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium",
              badgeOk
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-warning/10 text-warning",
            )}
          >
            {badgeOk ? (
              <CheckCircle2 className="w-3 h-3" aria-hidden />
            ) : (
              <AlertCircle className="w-3 h-3" aria-hidden />
            )}
            {badge}
          </span>
        )}
        {onVerify && (
          <button
            onClick={onVerify}
            className="text-xs font-medium text-primary hover:underline underline-offset-2"
          >
            {t("actions.verify")}
          </button>
        )}
      </div>
    </div>
  );
}
