"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { TaskResponseItem } from "shared/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFormatPrice } from "@/hooks/useFormatPrice";

const TEST_CARD = "4242 4242 4242 4242";

export const MockCheckoutDialog = ({
  response,
  busy,
  onCancel,
  onConfirm,
}: {
  response: TaskResponseItem | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (response: TaskResponseItem) => void;
}) => {
  const { t } = useTranslation(["tasks", "common"]);
  const price = useFormatPrice(response?.price ?? 0);
  return (
    <Dialog open={!!response} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t("checkout.title")}</DialogTitle>
              <DialogDescription>{t("checkout.description")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <CreditCard
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-grey"
            />
            <div className="min-w-0">
              <p className="font-mono text-sm text-foreground">{TEST_CARD}</p>
              <p className="text-xs text-grey">{t("checkout.testCard")}</p>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
            <span className="text-sm text-grey">{t("checkout.total")}</span>
            <span className="text-xl font-medium text-foreground">{price}</span>
          </div>
          <p className="text-xs text-grey">{t("checkout.note")}</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {t("common:actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => response && onConfirm(response)}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {busy ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Lock aria-hidden="true" className="h-4 w-4" />
              )}
              {t("checkout.pay")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
