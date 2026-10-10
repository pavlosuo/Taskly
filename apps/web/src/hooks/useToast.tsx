import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useToast() {
  const { t } = useTranslation("errors");
  return useCallback(
    (key?: string, type: "error" | "success" = "error") => {
      if (!key) return;
      toast?.[type](t(key), {
        duration: 3000,
        position: "top-right",
      });
    },
    [t],
  );
}
