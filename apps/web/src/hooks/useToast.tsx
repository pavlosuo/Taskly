import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

export function useToast() {
  const { t } = useTranslation(["common", "errors"]);
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
