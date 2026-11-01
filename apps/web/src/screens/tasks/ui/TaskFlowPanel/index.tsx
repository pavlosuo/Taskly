"use client";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Hourglass, Undo2, ShieldCheck } from "lucide-react";
import { Task, PaymentState } from "shared/index";
import { useTasks } from "@/providers/TaskProvider";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/button";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { ReviewPanel } from "@/screens/tasks/ui/ReviewPanel";
import { useFormatDate } from "@/hooks/useFormatDate";

const paymentState = (task: Task): PaymentState | null => {
  if (task.status === "assigned" || task.status === "pending_confirmation")
    return "held";
  if (task.status === "completed") return "released";
  if (task.status === "cancelled" && task.assignedTaskerId) return "refunded";
  return null;
};

const PaymentNote = ({
  state,
  amount,
}: {
  state: PaymentState;
  amount: number;
}) => {
  const { t } = useTranslation("tasks");
  const price = useFormatPrice(amount);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
      <ShieldCheck
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {t(`payment.${state}`, { amount: price })}
        </p>
        <p className="text-xs text-grey">{t("payment.testMode")}</p>
      </div>
    </div>
  );
};

export const TaskFlowPanel = ({
  task,
  role,
  amount,
  accepted,
  onClose,
}: {
  task: Task;
  role: "client" | "tasker";
  amount?: number;
  accepted?: boolean;
  onClose?: () => void;
}) => {
  const { t } = useTranslation("tasks");
  const { confirm } = useModal();
  const { markDone, abandonTask, isLoading } = useTasks();
  const state = amount ? paymentState(task) : null;
  const isParty = role === "client" || !!accepted;
  const autoConfirmDate = useFormatDate(task.autoConfirmAt, {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDone = async () => {
    if (isLoading || !(await confirm(t("flow.confirm.markDone")))) return;
    try {
      await markDone(task._id);
    } catch {}
  };

  const handleAbandon = async () => {
    if (isLoading || !(await confirm(t("flow.confirm.abandon")))) return;
    try {
      await abandonTask(task._id);
      onClose?.();
    } catch {}
  };

  const showTaskerActions =
    role === "tasker" && !!accepted && task.status === "assigned";
  const showPending = task.status === "pending_confirmation" && isParty;
  const showReview = task.status === "completed" && isParty;

  if (!state && !showTaskerActions && !showPending && !showReview) return null;

  return (
    <div className="flex flex-col gap-4">
      {state && amount ? <PaymentNote state={state} amount={amount} /> : null}
      {showPending && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3.5 py-3">
          <Hourglass
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"
          />
          <p className="text-sm text-foreground">
            {role === "client"
              ? t("flow.clientPending", { date: autoConfirmDate })
              : t("flow.taskerPending", { date: autoConfirmDate })}
          </p>
        </div>
      )}
      {showTaskerActions && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleAbandon}
            disabled={isLoading}
          >
            <Undo2 aria-hidden="true" className="h-3.5 w-3.5" />
            {t("flow.abandon")}
          </Button>
          <Button size="sm" onClick={handleDone} disabled={isLoading}>
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            {t("flow.markDone")}
          </Button>
        </div>
      )}
      {showReview && <ReviewPanel taskId={task._id} />}
    </div>
  );
};
