import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useToast() {
  const { t } = useTranslation(["errors", "common"]);
  return useCallback(
    (key?: string, type: "error" | "success" = "error") => {
      if (!key) return;
      const text = t(key);
      if (text === "undefined") return;
      toast?.[type](text, {
        duration: 3000,
        position: "top-right",
      });
    },
    [t],
  );
}
