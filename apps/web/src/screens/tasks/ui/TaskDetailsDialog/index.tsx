"use client";
import { startTransition, useEffect, useRef, useState, FormEvent } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Clock,
  Loader2,
  Pencil,
  Trash2,
  Ban,
  CheckCircle2,
  Send,
  ClipboardList,
  MapPinned,
  CalendarClock,
  ListChecks,
  Award,
  ArrowRight,
  ArrowLeft,
  Star,
} from "lucide-react";
import { useTasks } from "@/providers/TaskProvider";
import { useModal } from "@/providers/ModalProvider";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";
import { Switch } from "@/components/ui/switch";
import { Input, PriceInput, TagInput } from "@/components/shared/Input";
import { DatePicker } from "@/components/shared/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import { axiosApi } from "@/api/index";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { SectionLabel } from "@/screens/tasks/ui";
import { TaskStatusBadge } from "../TaskStatusBadge";
import { ResponseStatusBadge } from "../ResponseStatusBadge";
import { Tiptap } from "@/components/shared/Tiptap";
import clsx from "clsx";
import parseSafeHtml from "@/utils/parseSafeHtml";
import { useToast } from "@/hooks/useToast";
import {
  ZodErrors,
  TaskStatus,
  TaskUpdateForm,
  TaskResponseItem,
  TaskCreateForm,
  TaskResponseCreateForm,
  removeHtml,
  taskCreateSchema,
  taskResponseCreateSchema,
  TaskerStep,
  MESSAGE_MAX_LENGTH,
  Tasker,
  TaskResponseStatus,
} from "shared/index";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useFormatDate } from "@/hooks/useFormatDate";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import Link from "next/link";
import { TaskFlowPanel } from "@/screens/tasks/ui/TaskFlowPanel";
import { MockCheckoutDialog } from "@/screens/tasks/ui/MockCheckoutDialog";
import { useUser } from "@/providers/UserProvider";
import { useSingleTask } from "@/providers/SingleTaskProvider";

const DESCRIPTION_PREVIEW_LENGTH = 320;

const FINAL_STEP_STATUSES: TaskStatus[] = [
  "assigned",
  "pending_confirmation",
  "completed",
];

interface ViewProps {
  onClose: () => void;
}

const searchSkills = async (search: string) => {
  const { data } = await axiosApi.searchSkills(search);
  return data.items.map((skill) => ({ value: skill._id, label: skill.label }));
};

const createSkill = async (label: string) => {
  const { data } = await axiosApi.upsertSkill(label);
  return { value: data._id, label: data.label };
};

const searchCertificates = async (search: string) => {
  const { data } = await axiosApi.searchCertificates(search);
  return data.items.map((certificate) => ({
    value: certificate._id,
    label: certificate.label,
  }));
};

const createCertificate = async (label: string) => {
  const { data } = await axiosApi.upsertCertificate(label);
  return { value: data._id, label: data.label };
};

const useTaskResponses = (taskId?: string, status?: TaskStatus) => {
  const { getTaskResponses } = useTasks();
  const fetchRef = useRef(getTaskResponses);

  useEffect(() => {
    fetchRef.current = getTaskResponses;
  }, [getTaskResponses]);

  const [responses, setResponses] = useState<TaskResponseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      startTransition(() => {
        setLoading(false);
      });
      return;
    }
    let cancelled = false;
    startTransition(() => {
      setLoading(true);
    });

    fetchRef
      .current(taskId)
      .then((items) => {
        if (!cancelled) setResponses(items);
      })
      .catch(() => {
        if (!cancelled) setResponses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, status]);

  return { responses, setResponses, loading };
};

const Spinner = ({ className }: { className?: string }) => {
  const { t } = useTranslation("common");
  return (
    <div role="status" className={clsx("flex justify-center py-6", className)}>
      <Loader2
        aria-hidden="true"
        className="w-4 h-4 animate-spin text-foreground"
      />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
};

const TaskSummary = () => {
  const { task } = useSingleTask();
  const { t } = useTranslation("tasks");
  const deadline = useFormatDate(task.deadline.date, {
    month: "long",
    day: "numeric",
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const description = task.description ?? "";
  const isLong = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const displayedDescription =
    isExpanded || !isLong
      ? description
      : description.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "...";
  const price = useFormatPrice(task?.budget?.amount);
  const hasSkills = (task.skills?.length ?? 0) > 0;
  const hasCertificates = (task.certificates?.length ?? 0) > 0;
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
          <SectionLabel icon={ClipboardList}>
            {t("summary.details")}
          </SectionLabel>
          <p className="text-sm text-grey whitespace-pre-wrap mt-2">
            {displayedDescription}
          </p>
          {isLong && (
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-sm text-primary mt-1 self-end"
            >
              {isExpanded ? t("summary.showLess") : t("summary.showMore")}
            </button>
          )}
        </div>
        <div>
          <SectionLabel icon={MapPinned}>{t("summary.location")}</SectionLabel>
          <p className="text-sm text-grey my-2">{task.location.address}</p>
          <LocationPicker value={task.location} disabled />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <SectionLabel icon={CalendarClock}>
          {t("summary.schedule")}
        </SectionLabel>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <p className="text-xs text-grey flex items-center gap-1.5 mb-1">
              <Clock aria-hidden="true" className="w-4 h-4 text-foreground" />
              {t("summary.deadline")}
            </p>
            <p className="text-sm font-medium text-foreground">{deadline}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <p className="text-xs text-grey mb-1">{t("summary.budget")}</p>
            <p className="text-sm font-medium text-foreground">
              {task.budget?.amount ? price : t("item.negotiable")}
            </p>
          </div>
          {task.budget?.negotiable && (
            <p className="text-xs text-grey col-span-2">
              {t("summary.negotiableNote")}
            </p>
          )}
        </div>
        {hasSkills && (
          <div>
            <SectionLabel icon={ListChecks}>{t("summary.skills")}</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.skills.map((skill) => (
                <span
                  key={skill.value}
                  className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {skill.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {hasCertificates && (
          <div>
            <SectionLabel icon={Award}>
              {t("summary.certificates")}
            </SectionLabel>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.certificates.map((certificate) => (
                <span
                  key={certificate.value}
                  className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {certificate.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EditTaskForm = ({
  onSaved,
  onCancel,
}: {
  onSaved: (payload: TaskUpdateForm) => Promise<void>;
  onCancel: () => void;
}) => {
  const { task } = useSingleTask();
  const { t } = useTranslation(["tasks", "common"]);
  const toast = useToast();
  const [form, setForm] = useState<TaskCreateForm>(() => ({
    title: task.title,
    description: task.description ?? "",
    deadline: task.deadline,
    location: task.location,
    skills: task.skills ?? [],
    certificates: task.certificates ?? [],
    budget: {
      amount: task.budget?.amount ?? 0,
      negotiable: task.budget?.negotiable ?? false,
    },
  }));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ZodErrors<TaskCreateForm>>({});

  const handleUpdate = <K extends keyof TaskCreateForm>(
    key: K,
    value: TaskCreateForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setErrors({});
    const parsed = taskCreateSchema.safeParse(form);
    if (!parsed.success) {
      const { fieldErrors, formErrors } = parsed.error.flatten();
      setErrors({
        title: fieldErrors?.title?.[0],
        description: fieldErrors?.description?.[0],
        deadline: fieldErrors?.deadline?.[0],
        location: fieldErrors?.location?.[0],
        skills: fieldErrors?.skills?.[0],
        certificates: fieldErrors?.certificates?.[0],
        budget: fieldErrors?.budget?.[0],
      });
      if (formErrors[0]) toast(formErrors[0]);
      return;
    }
    setSaving(true);
    try {
      await onSaved({
        title: form.title.trim(),
        description: form.description.trim(),
        deadline: form.deadline,
        location: form.location,
        skills: form.skills,
        certificates: form.certificates,
        budget: form.budget,
      });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full grid grid-cols-1 grid-rows-[1fr_max-content_max-content]"
    >
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Pencil aria-hidden="true" className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <DialogTitle>{t("edit.title")}</DialogTitle>
            <DialogDescription>{t("edit.description")}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mt-2">
        <div className="flex flex-col gap-5">
          <SectionLabel icon={ClipboardList}>
            {t("create.sections.details")}
          </SectionLabel>
          <div className="form-group">
            <Label error={!!errors.title} htmlFor="edit-title">
              {t("create.fields.title.label")}
            </Label>
            <Input
              name="edit-title"
              value={form.title}
              onChange={(e) => handleUpdate("title", e.target.value)}
              error={errors.title}
            />
            <FieldError message={errors.title} />
          </div>
          <div className="form-group">
            <Label error={!!errors.description} htmlFor="edit-description">
              {t("create.fields.description.label")}
            </Label>
            <Textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => handleUpdate("description", e.target.value)}
              aria-invalid={!!errors.description}
              rows={8}
              className={clsx(
                "resize-none max-h-75",
                errors.description
                  ? "border-destructive focus-visible:ring-destructive/75"
                  : "border-border",
              )}
            />
            <FieldError message={errors.description} />
          </div>
          <div className="form-group">
            <SectionLabel icon={MapPinned}>
              {t("create.fields.location.label")}
            </SectionLabel>
            <LocationPicker
              value={form.location}
              onChange={(location) => handleUpdate("location", location)}
              error={errors.location}
            />
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <SectionLabel icon={CalendarClock}>
            {t("create.sections.schedule")}
          </SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="form-group">
              <Label error={!!errors.deadline} htmlFor="edit-deadline">
                {t("create.fields.deadline.label")}
              </Label>
              <DatePicker
                value={form.deadline}
                onChange={(date) => handleUpdate("deadline", date)}
                className="w-full"
                error={errors.deadline}
              />
              <FieldError message={errors.deadline} />
            </div>
            <div className="form-group">
              <Label error={!!errors.budget} htmlFor="edit-amount">
                {t("create.fields.budget.label")}
              </Label>
              <PriceInput
                name="edit-amount"
                value={form.budget?.amount || 0}
                onChange={(number) =>
                  handleUpdate("budget", { ...form.budget, amount: number })
                }
                placeholder={t("create.fields.budget.placeholder")}
                error={errors.budget}
              />
              <FieldError message={errors.budget} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("create.negotiable.title")}
              </p>
              <p className="text-xs text-grey">
                {t("create.negotiable.description")}
              </p>
            </div>
            <Switch
              aria-label={t("create.negotiable.title")}
              checked={form.budget.negotiable}
              onCheckedChange={(checked) =>
                handleUpdate("budget", { ...form.budget, negotiable: checked })
              }
            />
          </div>
          <SectionLabel icon={ListChecks}>
            {t("create.sections.requirements")}
          </SectionLabel>
          <TagInput
            label={t("create.fields.skills.label")}
            name="edit-skills"
            value={form.skills}
            onChange={(v) => handleUpdate("skills", v)}
            placeholder={t("create.fields.skills.placeholder")}
            error={errors.skills}
            searchFn={searchSkills}
            createFn={createSkill}
          />
          <TagInput
            label={t("create.fields.certificates.label")}
            name="edit-certificates"
            value={form.certificates}
            onChange={(v) => handleUpdate("certificates", v)}
            placeholder={t("create.fields.certificates.placeholder")}
            error={errors.certificates}
            searchFn={searchCertificates}
            createFn={createCertificate}
          />
        </div>
      </div>
      <div className="border-t border-border pt-5 mt-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving && (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            )}
            {t("edit.save")}
          </Button>
        </div>
      </div>
    </form>
  );
};

const StepTabs = ({
  step,
  onChange,
}: {
  step: TaskerStep;
  onChange: (step: TaskerStep) => void;
}) => {
  const { t } = useTranslation("tasks");
  const steps: { key: TaskerStep; number: number }[] = [
    { key: "overview", number: 1 },
    { key: "respond", number: 2 },
    { key: "complete", number: 3 },
  ];
  return (
    <div className="inline-flex items-center gap-1 self-start rounded-full border border-border bg-muted/30 p-1">
      {steps.map((s) => {
        const active = step === s.key;
        return (
          <button
            key={s.key}
            type="button"
            aria-current={active ? "step" : undefined}
            onClick={() => onChange(s.key)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full p-1.5 pr-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-grey hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                "flex h-4.5 w-4.5 items-center justify-center rounded-full text-xs font-semibold",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/10 text-grey",
              )}
            >
              {s.number}
            </span>
            {t(`respond.steps.${s.key}`)}
          </button>
        );
      })}
    </div>
  );
};

const ResponseCard = ({
  price,
  status,
  message,
  actions,
  tasker,
}: {
  price: number;
  status: TaskResponseStatus;
  message: string;
  actions?: React.ReactNode;
  tasker?: Tasker;
}) => {
  const { t } = useTranslation("tasks");
  const priceFormatted = useFormatPrice(price);
  const taskerContent = tasker && (
    <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-base font-semibold text-primary ring-1 ring-border">
          {tasker.avatar ? (
            <ImageDisplay
              src={tasker.avatar.url}
              alt={tasker.username}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            tasker.initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {tasker.username}
            </p>
            <ResponseStatusBadge status={status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {tasker.rating ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                <Star
                  aria-hidden="true"
                  className="size-3.5 fill-amber-500 text-amber-500"
                />
                {tasker.rating.avg.toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  ({tasker.rating.count})
                </span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("responses.noRating")}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {t("responses.completed", { count: tasker.completedCount ?? 0 })}
            </span>
          </div>
        </div>
      </div>
      {tasker.publicLink && (
        <Link
          href={tasker.publicLink}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t("responses.viewProfile")}
        </Link>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {taskerContent}
      {message && (
        <div className="text-wrapper text-sm leading-relaxed">
          {parseSafeHtml(message)}
        </div>
      )}
      <div
        className={clsx(
          "mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4",
          !tasker && "mt-0 border-t-0 pt-0",
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            {t("responses.offer")}
          </span>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {priceFormatted}
          </span>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

const ResponsesPanel = ({
  responses,
  loading,
  taskOpen,
  busy,
  onAccept,
  onReject,
}: {
  responses: TaskResponseItem[];
  loading: boolean;
  taskOpen: boolean;
  busy: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  const { t } = useTranslation("tasks");
  if (loading) return <Spinner />;
  if (responses.length === 0) {
    return (
      <p className="text-sm text-grey py-2 text-center">
        {t("responses.empty")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {responses.map((response) => (
        <ResponseCard
          tasker={response.tasker}
          key={response._id}
          price={response.price}
          status={response.status}
          message={response.message}
          actions={
            response.status === "pending" && taskOpen ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(response._id)}
                  disabled={busy}
                >
                  {t("responses.reject")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAccept(response._id)}
                  disabled={busy}
                >
                  {t("responses.accept")}
                </Button>
              </>
            ) : null
          }
        />
      ))}
    </div>
  );
};

const BackToOverview = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation("tasks");
  return (
    <div className="flex justify-start border-t border-border pt-5">
      <Button type="button" variant="outline" onClick={onClick}>
        <ArrowLeft aria-hidden="true" className="w-4 h-4" />
        {t("respond.backToOverview")}
      </Button>
    </div>
  );
};

export const ClientView = ({ onClose }: ViewProps) => {
  const { task } = useSingleTask();
  const { t } = useTranslation("tasks");
  const { user } = useUser();
  const { confirm } = useModal();
  const {
    updateTask,
    cancelTask,
    completeTask,
    deleteTask,
    acceptResponse,
    declineResponse,
    isLoading,
  } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [checkout, setCheckout] = useState<TaskResponseItem | null>(null);
  const [step, setStep] = useState<TaskerStep>("overview");
  const {
    responses,
    setResponses,
    loading: loadingResponses,
  } = useTaskResponses(task?._id, task?.status);
  const acceptedResponse = responses.find((r) => r.status === "accepted");
  const isMyTask = task?.clientId === user?._id;

  if (!task) return null;

  const handleAccept = async (responseId: string) => {
    if (isLoading) return;
    try {
      await acceptResponse(task._id, responseId);
      setResponses((prev) =>
        prev.map((r) => {
          if (r._id === responseId) return { ...r, status: "accepted" };
          if (r.status === "pending") return { ...r, status: "rejected" };
          return r;
        }),
      );
    } catch {}
  };

  const handleReject = async (responseId: string) => {
    if (isLoading) return;
    try {
      await declineResponse(task._id, responseId);
      setResponses((prev) =>
        prev.map((r) =>
          r._id === responseId ? { ...r, status: "rejected" } : r,
        ),
      );
    } catch {}
  };

  const handleCancel = async () => {
    if (isLoading || !(await confirm(t("view.confirm.cancel")))) return;
    try {
      await cancelTask(task._id);
    } catch {}
  };

  const handleComplete = async () => {
    if (isLoading) return;
    try {
      await completeTask(task._id);
    } catch {}
  };

  const handleDelete = async () => {
    if (isLoading || !(await confirm(t("view.confirm.delete")))) return;
    try {
      await deleteTask(task._id);
      onClose?.();
    } catch {}
  };

  if (isEditing) {
    return (
      <EditTaskForm
        onSaved={async (payload) => {
          await updateTask(task._id, payload);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const isFinal = FINAL_STEP_STATUSES.includes(task.status);

  return (
    <>
      <DialogHeader className="mb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList aria-hidden="true" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-8 max-w-[60%] md:max-w-[85%]">
            <DialogTitle className="line-clamp-1">{task.title}</DialogTitle>
            <DialogDescription>
              {t(isMyTask ? "view.description" : "view.descriptionNotOwned")}
            </DialogDescription>
          </div>
          <TaskStatusBadge
            status={task.status}
            className="absolute top-5 right-10 md:right-16"
          />
        </div>
      </DialogHeader>
      {isMyTask && (
        <div className="mb-5">
          <StepTabs step={step} onChange={setStep} />
        </div>
      )}

      {/* Монтируем только активный шаг: карта/редактор не живут скрытыми */}
      {(step === "overview" || !isMyTask) && (
        <div className="flex flex-col gap-5">
          <TaskSummary />
        </div>
      )}

      {isMyTask && step === "respond" && (
        <div className="flex flex-col gap-5">
          <ResponsesPanel
            responses={responses}
            loading={loadingResponses}
            taskOpen={task.status === "open"}
            busy={isLoading}
            onAccept={(id) =>
              setCheckout(responses.find((r) => r._id === id) ?? null)
            }
            onReject={handleReject}
          />
        </div>
      )}

      {isMyTask && step === "complete" && (
        <div className="flex flex-col gap-5">
          {isFinal ? (
            <TaskFlowPanel role="client" amount={acceptedResponse?.price} />
          ) : (
            <p className="text-sm text-grey py-2 text-center">
              {t("respond.finalLocked")}
            </p>
          )}
        </div>
      )}

      {isMyTask && checkout && (
        <MockCheckoutDialog
          response={checkout}
          busy={isLoading}
          onCancel={() => setCheckout(null)}
          onConfirm={async (response) => {
            setCheckout(null);
            await handleAccept(response._id);
          }}
        />
      )}

      {isMyTask &&
        (task.status === "open" ||
          task.status === "expired" ||
          task.status === "assigned" ||
          task.status === "pending_confirmation" ||
          (task.status === "cancelled" && !task.assignedTaskerId)) && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border justify-end pt-5">
            {task.status === "open" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                <Pencil aria-hidden="true" className="w-3.5 h-3.5" />
                {t("view.actions.edit")}
              </Button>
            )}
            {(task.status === "open" || task.status === "assigned") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <Ban aria-hidden="true" className="w-3.5 h-3.5" />
                {t("view.actions.cancel")}
              </Button>
            )}
            {(task.status === "assigned" ||
              task.status === "pending_confirmation") && (
              <Button size="sm" onClick={handleComplete} disabled={isLoading}>
                <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5" />
                {t("view.actions.complete")}
              </Button>
            )}
            {(task.status === "open" ||
              task.status === "expired" ||
              (task.status === "cancelled" && !task.assignedTaskerId)) && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                {t("view.actions.delete")}
              </Button>
            )}
          </div>
        )}
    </>
  );
};

export const TaskerView = ({ onClose }: ViewProps) => {
  const { task } = useSingleTask();
  const toast = useToast();
  const { t } = useTranslation(["tasks", "common"]);
  const { respondToTask, withdrawResponse, isLoading } = useTasks();
  const { responses, setResponses, loading } = useTaskResponses(
    task?._id,
    task?.status,
  );
  const myResponse = responses[0] ?? null;
  const [errors, setErrors] = useState<ZodErrors<TaskResponseCreateForm>>({});
  const [step, setStep] = useState<TaskerStep>("overview");
  const [form, setForm] = useState<TaskResponseCreateForm>({
    message: "",
    price: 0,
  });

  if (!task) return null;

  const handleRespond = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrors({});
    const parsed = taskResponseCreateSchema.safeParse(form);
    if (!parsed.success) {
      const { fieldErrors, formErrors } = parsed.error.flatten();
      setErrors({
        message: fieldErrors.message?.[0],
        price: fieldErrors.price?.[0],
      });
      if (formErrors[0]) toast(formErrors[0]);
      return;
    }
    try {
      const response = await respondToTask(
        task._id,
        parsed.data as { message: string; price: number },
      );
      setResponses([response]);
    } catch {}
  };

  const handleWithdraw = async () => {
    if (!myResponse || isLoading) return;
    try {
      await withdrawResponse(task._id, myResponse._id);
      setResponses([]);
      setForm({ message: "", price: 0 });
      setStep("overview");
    } catch {}
  };

  const messageLength = removeHtml(form.message ?? "").length;

  return (
    <>
      <DialogHeader className="mb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Send aria-hidden="true" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-8 max-w-[60%] md:max-w-[85%]">
            <DialogTitle className="line-clamp-1">{task.title}</DialogTitle>
            <DialogDescription>{t("respond.description")}</DialogDescription>
          </div>
          <TaskStatusBadge
            status={task.status}
            className="absolute top-5 right-10 md:right-16"
          />
        </div>
      </DialogHeader>
      <div className="mb-5">
        <StepTabs step={step} onChange={setStep} />
      </div>

      {step === "overview" && (
        <div className="flex flex-col gap-5">
          <TaskSummary />
          <div className="flex justify-end border-t border-border pt-5">
            <Button
              onClick={() => setStep("respond")}
              className="w-full sm:w-auto"
            >
              {t("respond.continue")}
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "respond" && (
        <div className="flex flex-col gap-5">
          {loading && <Spinner />}
          {!loading && task.status !== "open" && !myResponse && (
            <h3 className="text-md text-grey py-2 text-center">
              {t("respond.closed")}
            </h3>
          )}
          {!loading && task.status === "open" && !myResponse && (
            <form
              onSubmit={handleRespond}
              noValidate
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[80%_1fr]">
                <div className="form-group">
                  <Label htmlFor="respond-message" error={!!errors.message}>
                    {t("respond.message.label")}
                  </Label>
                  <Tiptap
                    key="respond-editor"
                    value={form.message}
                    error={errors.message}
                    onUpdate={({ editor }) => {
                      setForm((prev) => ({
                        ...prev,
                        message: editor.getHTML(),
                      }));
                      setErrors((p) => ({ ...p, message: undefined }));
                    }}
                  />
                  <FieldError message={errors.message} />
                  <p
                    className={clsx(
                      "text-xs text-right mt-1",
                      messageLength > MESSAGE_MAX_LENGTH
                        ? "text-destructive"
                        : "text-grey",
                    )}
                  >
                    {messageLength}/{MESSAGE_MAX_LENGTH}
                  </p>
                </div>
                <div className="form-group">
                  <Label htmlFor="price" error={!!errors.price}>
                    {t("respond.price.label")}
                  </Label>
                  <PriceInput
                    name="price"
                    value={form.price}
                    onChange={(number) => {
                      setForm((p) => ({ ...p, price: number }));
                      setErrors((p) => ({ ...p, price: undefined }));
                    }}
                    placeholder={t("respond.price.placeholder")}
                    error={errors.price}
                  />
                  <FieldError message={errors.price} />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("overview")}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft
                    aria-hidden="true"
                    className="w-4 h-4 text-[currentColor]"
                  />
                  {t("common:actions.back")}
                </Button>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {t("common:actions.close")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <Loader2
                        aria-hidden="true"
                        className="w-4 h-4 animate-spin text-[currentColor]"
                      />
                    ) : (
                      <Send
                        aria-hidden="true"
                        className="w-4 h-4 text-[currentColor]"
                      />
                    )}
                    {t("respond.send")}
                  </Button>
                </div>
              </div>
            </form>
          )}
          {!loading && myResponse && (
            <>
              <ResponseCard
                price={myResponse.price}
                status={myResponse.status}
                message={myResponse.message}
                actions={
                  myResponse.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleWithdraw}
                      disabled={isLoading}
                    >
                      {t("respond.withdraw")}
                    </Button>
                  ) : null
                }
              />
              <BackToOverview onClick={() => setStep("overview")} />
            </>
          )}
        </div>
      )}

      {step === "complete" && (
        <div className="flex flex-col gap-5">
          {loading && <Spinner />}
          {!loading && !FINAL_STEP_STATUSES.includes(task.status) && (
            <p className="text-sm text-grey py-2 text-center">
              {t("respond.finalLocked")}
            </p>
          )}
          {!loading &&
            myResponse &&
            FINAL_STEP_STATUSES.includes(task.status) && (
              <TaskFlowPanel
                role="tasker"
                amount={myResponse.price}
                accepted={myResponse.status === "accepted"}
                onClose={onClose}
              />
            )}
          <BackToOverview onClick={() => setStep("overview")} />
        </div>
      )}
    </>
  );
};
