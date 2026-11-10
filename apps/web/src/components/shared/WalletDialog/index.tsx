"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2, Wallet } from "lucide-react";
import clsx from "clsx";
import { PaymentHistory, PaymentItem, PaymentStatus } from "shared/index";
import { useTasks } from "@/providers/TaskProvider";
import { useUser } from "@/providers/UserProvider";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFormatDate } from "@/hooks/useFormatDate";

const STATUSES: PaymentStatus[] = ["held", "released", "refunded"];

const STATUS_STYLES: Record<PaymentStatus, string> = {
  held: "border-amber-500/15 bg-amber-500/8 text-amber-600",
  released: "border-emerald-500/15 bg-emerald-500/8 text-emerald-600",
  refunded: "border-muted bg-muted text-grey",
};

const Money = ({ value }: { value: number }) => {
  const price = useFormatPrice(value);
  return <>{price}</>;
};

const PaymentRow = ({ item }: { item: PaymentItem }) => {
  const { t } = useTranslation("tasks");
  const date = useFormatDate(item.updatedAt, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <span
          className={clsx(
            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
            STATUS_STYLES[item.status],
          )}
        >
          {t(`wallet.status.${item.status}`)}
        </span>
        <p className="mt-1 text-xs text-grey">{date}</p>
      </div>
      <span className="text-sm font-medium text-foreground">
        <Money value={item.amount} />
      </span>
    </div>
  );
};

export const WalletDialog = () => {
  const { t } = useTranslation(["tasks", "common"]);
  const { getPayments } = useTasks();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaymentHistory | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async function () {
      setLoading(true);
      try {
        const history = await getPayments();
        if (!cancelled) setData(history);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, getPayments]);

  if (user?.role === "admin") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={t("wallet.open")}
          type="button"
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-full border-border bg-background"
        >
          <Wallet aria-hidden="true" className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t("wallet.title")}</DialogTitle>
              <DialogDescription>{t("wallet.description")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {loading && !data && (
          <div role="status" className="flex justify-center py-6">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            <span className="sr-only">{t("common:loading")}</span>
          </div>
        )}
        {data && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <div
                  key={s}
                  className="min-w-35 w-full flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                >
                  <p className="text-xs text-grey">
                    {t(`wallet.${user?.role}.${s}`)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    <Money value={data.totals[s]} />
                  </p>
                </div>
              ))}
            </div>
            {data.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-grey">
                {t("wallet.empty")}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data.items.map((item) => (
                  <PaymentRow key={item._id} item={item} />
                ))}
              </div>
            )}
            <p className="text-xs text-grey">{t("payment.testMode")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
