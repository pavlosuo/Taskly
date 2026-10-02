"use client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, FormEvent } from "react";
import {
  Loader2,
  Plus,
  ClipboardList,
  CalendarClock,
  ListChecks,
} from "lucide-react";
import { useTasks } from "@/providers/TaskProvider";
import { Input, PriceInput, TagInput } from "@/components/shared/Input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { taskCreateSchema, ZodErrors, TaskCreateForm } from "shared/index";
import { axiosApi } from "@/api/index";
import { DatePicker } from "@/components/shared/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { SectionLabel } from "@/screens/tasks/ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";
import clsx from "clsx";

const INITIAL_STATE: TaskCreateForm = {
  title: "",
  description: "",
  deadline: undefined,
  budget: {
    amount: 0,
    negotiable: false,
  },
  skills: [],
  location: {
    address: "",
    lat: 0,
    lng: 0,
  },
  certificates: [],
};

export const CreateTaskDialog = () => {
  const [open, setOpen] = useState(false);
  const { createTask, isLoading } = useTasks();
  const [form, setForm] = useState<TaskCreateForm>(INITIAL_STATE);
  const [errors, setErrors] = useState<ZodErrors<TaskCreateForm>>({});

  const handleUpdate = <K extends keyof TaskCreateForm>(
    field: K,
    value: TaskCreateForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    try {
      e.preventDefault();
      setErrors({});
      const parsed = taskCreateSchema.safeParse(form);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        setErrors({
          title: fieldErrors?.title?.[0],
          description: fieldErrors?.description?.[0],
          skills: fieldErrors?.skills?.[0],
          certificates: fieldErrors?.certificates?.[0],
          budget: fieldErrors?.budget?.[0],
          location: fieldErrors?.location?.[0],
          deadline: fieldErrors?.deadline?.[0],
          general: formErrors[0],
        });
        return;
      }
      await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        skills: form.skills,
        certificates: form.certificates,
        budget: form.budget,
        location: form.location,
        deadline: form.deadline,
      });
      setForm(INITIAL_STATE);
      setOpen(false);
    } catch (e) {
      setErrors({
        general: getAxiosError(e),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="w-4 h-4" />
          New task
        </Button>
      </DialogTrigger>
      <DialogContent className="grid grid-cols-1 grid-rows-[max-content_1fr] sm:max-w-5xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Create a new task</DialogTitle>
              <DialogDescription>
                Give it a clear title, a place, and a deadline — taskers will
                find it in search.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="w-full grid grid-cols-1 grid-rows-[1fr_max-content]"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-5">
              <SectionLabel icon={ClipboardList}>Task details</SectionLabel>
              <div className="form-group">
                <Label error={!!errors.title} htmlFor="title">
                  Task title
                </Label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={(e) => handleUpdate("title", e.target.value)}
                  placeholder="e.g. Assemble an IKEA wardrobe"
                  error={errors.title}
                />
                <FieldError message={errors.title} />
              </div>
              <div className="form-group">
                <Label error={!!errors.description} htmlFor="description">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleUpdate("description", e.target.value)}
                  placeholder="Describe what needs to be done, the scope of work, and any important details."
                  rows={8}
                  className={clsx(
                    "resize-none",
                    errors.description
                      ? "border-destructive focus-visible:ring-destructive/75"
                      : "border-border",
                  )}
                />
                <FieldError message={errors.description} />
              </div>
              <div className="form-group">
                <Label error={!!errors.location} htmlFor="location-search">
                  Location
                </Label>
                <LocationPicker
                  value={form.location}
                  onChange={(location) => handleUpdate("location", location)}
                  error={errors.location}
                />
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <SectionLabel icon={CalendarClock}>
                Schedule & budget
              </SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-group">
                  <Label error={!!errors.deadline} htmlFor="deadline">
                    Deadline
                  </Label>
                  <DatePicker
                    onChange={(date) => handleUpdate("deadline", date)}
                    value={form.deadline}
                    className="w-full"
                    error={errors.deadline}
                  />
                  <FieldError message={errors.deadline} />
                </div>
                <div className="form-group">
                  <Label error={!!errors.budget} htmlFor="amount">
                    Budget
                  </Label>
                  <PriceInput
                    name="amount"
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
                  <FieldError message={errors.budget} />
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
                value={form.skills}
                onChange={(v) => handleUpdate("skills", v)}
                placeholder="Search or add a skill..."
                name="skills"
                error={errors.skills}
                searchFn={async (search: string) => {
                  const { data } = await axiosApi.searchSkills(search);
                  return data.items.map((skill) => ({
                    value: skill._id,
                    label: skill.label,
                  }));
                }}
                createFn={async (label: string) => {
                  const { data } = await axiosApi.upsertSkill(label);
                  return {
                    value: data._id,
                    label: data.label,
                  };
                }}
              />
              <TagInput
                label="Required certificates"
                value={form.certificates}
                onChange={(v) => handleUpdate("certificates", v)}
                placeholder="Search or add a certificate..."
                name="certificates"
                error={errors.certificates}
                searchFn={async (search: string) => {
                  const { data } = await axiosApi.searchCertificates(search);
                  return data.items.map((certificate) => ({
                    value: certificate._id,
                    label: certificate.label,
                  }));
                }}
                createFn={async (label: string) => {
                  const { data } = await axiosApi.upsertCertificate(label);
                  return {
                    value: data._id,
                    label: data.label,
                  };
                }}
              />
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-5">
            {errors.general && (
              <p className="mb-4 text-xs text-destructive">{errors.general}</p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create task
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
