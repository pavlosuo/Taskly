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
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";
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
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";
import clsx from "clsx";
import { useCallback } from "react";

const INITIAL_STATE: TaskCreateForm = {
  title: "",
  description: "",
  deadline: {
    date: undefined,
    time: "",
  },
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
  const { t } = useTranslation(["tasks", "common", "errors"]);
  const [open, setOpen] = useState(false);
  const { createTask, isLoading } = useTasks();
  const [form, setForm] = useState<TaskCreateForm>(INITIAL_STATE);
  const [errors, setErrors] = useState<ZodErrors<TaskCreateForm>>({});
  const toast = useToast();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setErrors({});
  };

  const handleUpdate = <K extends keyof TaskCreateForm>(
    field: K,
    value: TaskCreateForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
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
      });
      toast(formErrors[0]);
      return;
    }
    try {
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
    } catch {}
  };

  const searchFn = useCallback(async (search: string) => {
    const { data } = await axiosApi.searchSkills(search);
    return data.items.map((skill) => ({
      value: skill._id,
      label: skill.label,
    }));
  }, []);

  const createFn = useCallback(async (label: string) => {
    const { data } = await axiosApi.upsertSkill(label);
    return {
      value: data._id,
      label: data.label,
    };
  }, []);

  const searchFnCert = useCallback(async (search: string) => {
    const { data } = await axiosApi.searchCertificates(search);
    return data.items.map((certificate) => ({
      value: certificate._id,
      label: certificate.label,
    }));
  }, []);

  const createFnCert = useCallback(async (label: string) => {
    const { data } = await axiosApi.upsertCertificate(label);
    return {
      value: data._id,
      label: data.label,
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus aria-hidden="true" className="w-4 h-4" />
          {t("create.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="grid grid-cols-1 grid-rows-[max-content_1fr] sm:max-w-5xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList aria-hidden="true" className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{t("create.title")}</DialogTitle>
              <DialogDescription>{t("create.description")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full grid grid-cols-1 grid-rows-[1fr_max-content]"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-5">
              <SectionLabel icon={ClipboardList}>
                {t("create.sections.details")}
              </SectionLabel>
              <div className="form-group">
                <Label error={!!errors.title} htmlFor="title">
                  {t("create.fields.title.label")}
                </Label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={(e) => handleUpdate("title", e.target.value)}
                  placeholder={t("create.fields.title.placeholder")}
                  error={errors.title}
                />
                <FieldError message={errors.title} />
              </div>
              <div className="form-group">
                <Label error={!!errors.description} htmlFor="description">
                  {t("create.fields.description.label")}
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleUpdate("description", e.target.value)}
                  placeholder={t("create.fields.description.placeholder")}
                  aria-invalid={!!errors.description}
                  rows={8}
                  className={clsx(
                    "resize-none border",
                    errors.description
                      ? "border-destructive focus-visible:ring-destructive/75"
                      : "border-border",
                  )}
                />
                <FieldError message={errors.description} />
              </div>
              <div className="form-group">
                <Label error={!!errors.location} htmlFor="location-search">
                  {t("create.fields.location.label")}
                </Label>
                <LocationPicker
                  value={form.location}
                  onChange={(location) => handleUpdate("location", location)}
                  error={errors.location}
                  onError={(e) => {
                    setErrors((p) => ({ ...p, location: e }));
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <SectionLabel icon={CalendarClock}>
                {t("create.sections.schedule")}
              </SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-group">
                  <Label error={!!errors.deadline} htmlFor="deadline">
                    {t("create.fields.deadline.label")}
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
                    {t("create.fields.budget.label")}
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
                    handleUpdate("budget", {
                      ...form.budget,
                      negotiable: checked,
                    })
                  }
                />
              </div>
              <SectionLabel icon={ListChecks}>
                {t("create.sections.requirements")}
              </SectionLabel>
              <TagInput
                label={t("create.fields.skills.label")}
                value={form.skills}
                onChange={(v) => handleUpdate("skills", v)}
                placeholder={t("create.fields.skills.placeholder")}
                name="skills"
                error={errors.skills}
                searchFn={searchFn}
                createFn={createFn}
              />
              <TagInput
                label={t("create.fields.certificates.label")}
                value={form.certificates}
                onChange={(v) => handleUpdate("certificates", v)}
                placeholder={t("create.fields.certificates.placeholder")}
                name="certificates"
                error={errors.certificates}
                searchFn={searchFnCert}
                createFn={createFnCert}
              />
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {t("common:actions.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin text-foreground"
                  />
                ) : (
                  <Plus
                    aria-hidden="true"
                    className="h-4 w-4 text-foreground"
                  />
                )}
                {t("create.submit")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
