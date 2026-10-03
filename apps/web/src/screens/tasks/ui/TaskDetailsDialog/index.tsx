"use client";
import { useEffect, useState, FormEvent, startTransition } from "react";
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
  MessagesSquare,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useTasks } from "@/providers/TaskProvider";
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
import {
  SectionLabel,
  TaskStatusBadge,
  ResponseStatusBadge,
} from "@/screens/tasks/ui";
import { formatPrice } from "@/utils/formatPrice";
import { Tiptap } from "@/components/shared/Tiptap";
import clsx from "clsx";
import parseSafeHtml from "@/utils/parseSafeHtml";
import { TaskerStep } from "@/screens/tasks/types";
import { getAxiosError } from "@/utils/getAxiosError";
import {
  ZodErrors,
  Task,
  TaskUpdateForm,
  TaskResponseItem,
  TaskCreateForm,
  TaskResponseCreateForm,
  removeHtml,
  taskCreateSchema,
  taskResponseCreateSchema,
} from "shared/index";

interface ViewProps {
  task: Task | null;
  onClose: () => void;
}

const TaskSummary = ({ task }: { task: Task }) => {
  const limit = 320;
  const deadline = new Date(task.deadline).toLocaleDateString();
  const [isExpanded, setIsExpanded] = useState(false);
  const description = task.description ?? "";
  const isLong = description.length > limit;
  const displayedDescription =
    isExpanded || !isLong ? description : description.slice(0, limit) + "...";
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
          <SectionLabel icon={ClipboardList}>Details</SectionLabel>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
            {displayedDescription}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-sm text-primary mt-1 self-end"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div>
          <SectionLabel icon={MapPinned}>Location</SectionLabel>
          <p className="text-sm text-muted-foreground my-2">
            {task.location.address}
          </p>
          <LocationPicker value={task.location} disabled />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <SectionLabel icon={CalendarClock}>Schedule & budget</SectionLabel>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Deadline
            </p>
            <p className="text-sm font-medium text-foreground">{deadline}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <p className="text-xs text-muted-foreground mb-1">Budget</p>
            <p className="text-sm font-medium text-foreground">
              {task.budget?.amount
                ? `${formatPrice(task.budget.amount)}`
                : "Negotiable"}
            </p>
          </div>
          {task.budget?.negotiable && (
            <p className="text-xs text-muted-foreground col-span-2">
              Budget is negotiable — the amount above is a starting point.
            </p>
          )}
        </div>
        {task.skills?.length > 0 && (
          <div>
            <SectionLabel icon={ListChecks}>Skills</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.skills.map((skill) => (
                <span
                  key={skill.value}
                  className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary"
                >
                  {skill.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {task.certificates?.length > 0 && (
          <div>
            <SectionLabel icon={Award}>Certificates</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.certificates.map((certificate) => (
                <span
                  key={certificate.value}
                  className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary"
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
  task,
  onSaved,
  onCancel,
}: {
  task: Task;
  onSaved: (payload: TaskUpdateForm) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<TaskCreateForm>(task);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ZodErrors<TaskCreateForm>>({});

  const handleUpdate = <K extends keyof TaskCreateForm>(
    key: K,
    value: TaskCreateForm[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
        general: formErrors[0],
      });
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
    } catch (e) {
      setErrors({
        general: getAxiosError(e),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full grid grid-cols-1 grid-rows-[1fr_max-content_max-content]"
    >
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update the details below and save your changes.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mt-2">
        <div className="flex flex-col gap-5">
          <SectionLabel icon={ClipboardList}>Task details</SectionLabel>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-title">Task title</Label>
            <Input
              name="edit-title"
              value={form.title}
              onChange={(e) => handleUpdate("title", e.target.value)}
              error={errors.title}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => handleUpdate("description", e.target.value)}
              rows={8}
              className="resize-none max-h-75"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <SectionLabel icon={MapPinned}>Location</SectionLabel>
            <LocationPicker
              value={form.location}
              onChange={(location) => handleUpdate("location", location)}
              error={errors.location}
            />
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <SectionLabel icon={CalendarClock}>Schedule & budget</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-deadline">Deadline</Label>
              <DatePicker
                value={form.deadline}
                onChange={(date) => handleUpdate("deadline", date)}
                className="w-full"
                error={errors.deadline}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-amount">Budget</Label>
              <PriceInput
                name="edit-amount"
                value={form.budget?.amount || 0}
                onChange={(number) =>
                  handleUpdate("budget", {
                    ...form.budget,
                    amount: number,
                  })
                }
                placeholder="Optional"
                error={errors.budget}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Budget is negotiable
              </p>
              <p className="text-xs text-muted-foreground">
                Taskers can suggest their own price
              </p>
            </div>
            <Switch
              checked={form.budget.negotiable}
              onCheckedChange={(checked) =>
                handleUpdate("budget", {
                  ...form.budget,
                  negotiable: checked,
                })
              }
            />
          </div>
          <SectionLabel icon={ListChecks}>Requirements</SectionLabel>
          <TagInput
            label="Required skills"
            name="edit-skills"
            value={form.skills}
            onChange={(v) => handleUpdate("skills", v)}
            placeholder="Search or add a skill..."
            searchFn={async (search: string) => {
              const { data } = await axiosApi.searchSkills(search);
              return data.items.map((skill) => ({
                value: skill._id,
                label: skill.label,
              }));
            }}
            createFn={async (label: string) => {
              const { data } = await axiosApi.upsertSkill(label);
              return { value: data._id, label: data.label };
            }}
          />
          <TagInput
            label="Required certificates"
            name="edit-certificates"
            value={form.certificates}
            onChange={(v) => handleUpdate("certificates", v)}
            placeholder="Search or add a certificate..."
            searchFn={async (search: string) => {
              const { data } = await axiosApi.searchCertificates(search);
              return data.items.map((certificate) => ({
                value: certificate._id,
                label: certificate.label,
              }));
            }}
            createFn={async (label: string) => {
              const { data } = await axiosApi.upsertCertificate(label);
              return { value: data._id, label: data.label };
            }}
          />
        </div>
      </div>
      <div className="border-t border-border pt-5 mt-5">
        {errors.general && (
          <p className="mb-5 text-xs text-destructive">{errors.general}</p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            Save changes
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
  const steps: { key: TaskerStep; number: number; label: string }[] = [
    { key: "overview", number: 1, label: "Overview" },
    { key: "respond", number: 2, label: "Respond" },
  ];
  return (
    <div className="inline-flex items-center gap-1 self-start rounded-full border border-border bg-muted/30 p-1">
      {steps.map((s) => {
        const active = step === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full p-1.5 pr-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={clsx(
                "flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-semibold",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/10 text-muted-foreground",
              )}
            >
              {s.number}
            </span>
            {s.label}
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
}: {
  price: number;
  status: TaskResponseItem["status"];
  message: string;
  actions?: React.ReactNode;
}) => (
  <div className="border border-border bg-muted/25 p-4">
    <div className="flex items-center justify-between gap-3 mb-3.5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-medium text-foreground">
          {formatPrice(price)}
        </span>
        <span className="text-xs text-muted-foreground">offer</span>
      </div>
      <ResponseStatusBadge status={status} />
    </div>
    <div className="text-wrapper">{message ? parseSafeHtml(message) : ""}</div>
    {actions && (
      <div className="flex justify-end gap-2 mt-4 pt-3.5 border-t border-border">
        {actions}
      </div>
    )}
  </div>
);

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
  const [open, setOpen] = useState(false);
  const count = responses.length;
  return (
    <div className="border-t border-border py-5 mt-5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2"
      >
        <SectionLabel icon={MessagesSquare}>
          {count > 0 ? `Responses (${count})` : "Responses"}
        </SectionLabel>
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pt-3">
            {loading && (
              <div className="flex justify-center py-6 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {!loading && count === 0 && (
              <p className="text-sm text-muted-foreground">
                No one has responded yet.
              </p>
            )}
            {count > 0 && (
              <div className="flex flex-col gap-3">
                {responses.map((response) => (
                  <ResponseCard
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
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onAccept(response._id)}
                            disabled={busy}
                          >
                            Accept
                          </Button>
                        </>
                      ) : null
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClientView = ({ task, onClose }: ViewProps) => {
  const {
    updateTask,
    cancelTask,
    completeTask,
    deleteTask,
    acceptResponse,
    getTaskResponses,
    declineResponse,
  } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [responses, setResponses] = useState<TaskResponseItem[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!task) return;
    startTransition(() => {
      setLoadingResponses(true);
    });
    getTaskResponses(task._id)
      .then((items) => {
        if (!cancelled) setResponses(items);
      })
      .catch((e) => {
        if (!cancelled) setError(getAxiosError(e));
      })
      .finally(() => {
        if (!cancelled) setLoadingResponses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [task, getTaskResponses]);

  if (!task) return null;

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(getAxiosError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = (responseId: string) =>
    runAction(async () => {
      await acceptResponse(task._id, responseId);
      setResponses((prev) =>
        prev.map((r) =>
          r._id === responseId ? { ...r, status: "accepted" } : r,
        ),
      );
    });

  const handleReject = (responseId: string) =>
    runAction(async () => {
      await declineResponse(task._id, responseId);
      setResponses((prev) =>
        prev.map((r) =>
          r._id === responseId ? { ...r, status: "rejected" } : r,
        ),
      );
    });

  const handleCancel = () => runAction(() => cancelTask(task._id));

  const handleComplete = () => runAction(() => completeTask(task._id));

  const handleDelete = () =>
    runAction(async () => {
      await deleteTask(task._id);
      onClose();
    });

  if (isEditing) {
    return (
      <EditTaskForm
        task={task}
        onSaved={async (payload) => {
          await updateTask(task._id, payload);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      <DialogHeader className="mb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <DialogTitle className="line-clamp-1">{task.title}</DialogTitle>
            <DialogDescription>
              Manage this task and review responses.
            </DialogDescription>
          </div>
          <TaskStatusBadge
            status={task.status}
            className="absolute top-5 right-16"
          />
        </div>
      </DialogHeader>
      <TaskSummary task={task} />
      <ResponsesPanel
        responses={responses}
        loading={loadingResponses}
        taskOpen={task.status === "open"}
        busy={busy}
        onAccept={handleAccept}
        onReject={handleReject}
      />
      <div className="flex flex-wrap gap-2 border-t border-border justify-end pt-5">
        {task.status === "open" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={busy}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        )}
        {(task.status === "open" || task.status === "assigned") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={busy}
          >
            <Ban className="w-3.5 h-3.5" />
            Cancel task
          </Button>
        )}
        {task.status === "assigned" && (
          <Button size="sm" onClick={handleComplete} disabled={busy}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark completed
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={busy}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>
      <FieldError message={error} />
    </>
  );
};

export const TaskerView = ({ task, onClose }: ViewProps) => {
  const { respondToTask, withdrawResponse, getTaskResponses } = useTasks();
  const [myResponse, setMyResponse] = useState<TaskResponseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<ZodErrors<TaskResponseCreateForm>>({});
  const [step, setStep] = useState<TaskerStep>("overview");
  const [form, setForm] = useState<TaskResponseCreateForm>({
    message: "",
    price: 0,
  });

  useEffect(() => {
    let cancelled = false;
    if (!task) return;
    startTransition(() => {
      setLoading(true);
    });
    getTaskResponses(task._id)
      .then((items) => {
        if (!cancelled) setMyResponse(items[0] ?? null);
      })
      .catch((e) => {
        if (!cancelled)
          setErrors({
            general: getAxiosError(e),
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [task, getTaskResponses]);

  if (!task) return null;

  const handleRespond = async (e: FormEvent) => {
    try {
      e.preventDefault();
      setErrors({});
      const parsed = taskResponseCreateSchema.safeParse(form);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        setErrors({
          message: fieldErrors.message?.[0],
          price: fieldErrors.price?.[0],
          general: formErrors[0],
        });
        return;
      }
      setBusy(true);
      const response = await respondToTask(task._id, form);
      setMyResponse(response);
    } catch (e) {
      setErrors({
        message: getAxiosError(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myResponse) return;
    setBusy(true);
    setErrors({});
    try {
      await withdrawResponse(task._id, myResponse._id);
      setMyResponse({ ...myResponse, status: "withdrawn" });
    } catch (e) {
      setErrors({
        message: getAxiosError(e),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader className="mb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Send className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="line-clamp-1">{task.title}</DialogTitle>
            <DialogDescription>
              Review the task and send your response.
            </DialogDescription>
            <TaskStatusBadge
              status={task.status}
              className="absolute top-5 right-16"
            />
          </div>
        </div>
      </DialogHeader>
      <div className="mb-5">
        <StepTabs step={step} onChange={setStep} />
      </div>
      {step === "overview" && (
        <div className="flex flex-col gap-5">
          <TaskSummary task={task} />
          <div className="flex justify-end border-t border-border pt-5">
            <Button
              onClick={() => setStep("respond")}
              className="w-full sm:w-auto"
            >
              {myResponse ? "View your response" : "Continue to respond"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      {step === "respond" && (
        <div className="flex flex-col gap-5">
          {loading && (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {!loading && task.status !== "open" && !myResponse && (
            <p className="text-sm text-muted-foreground py-2">
              This task is no longer accepting responses.
            </p>
          )}
          {!loading &&
          task.status === "open" &&
          (!myResponse || myResponse.status === "withdrawn") ? (
            <form onSubmit={handleRespond} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[80%_1fr]">
                <div className="form-group">
                  <Label htmlFor="respond-message" error={!!errors.message}>
                    Message to the client
                  </Label>
                  <Tiptap
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
                      removeHtml(form.message ?? "").length > 1000
                        ? "text-destructive"
                        : "text-grey",
                    )}
                  >
                    {removeHtml(form.message ?? "").length}/1000
                  </p>
                </div>
                <div className="form-group">
                  <Label htmlFor="price" error={!!errors.price}>
                    Your price
                  </Label>
                  <PriceInput
                    name="price"
                    value={form.price}
                    onChange={(number) => {
                      setForm((p) => ({
                        ...p,
                        price: number,
                      }));
                      setErrors((p) => ({ ...p, price: undefined }));
                    }}
                    placeholder="Budget"
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
                  disabled={busy}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={busy}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full sm:w-auto"
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send response
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            !loading &&
            myResponse && (
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
                        disabled={busy}
                      >
                        Withdraw
                      </Button>
                    ) : null
                  }
                />
                <div className="flex justify-start border-t border-border pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("overview")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to overview
                  </Button>
                </div>
              </>
            )
          )}
        </div>
      )}
      {errors.general && step !== "respond" && (
        <p className="text-xs text-destructive mt-5">{errors.general}</p>
      )}
    </>
  );
};
