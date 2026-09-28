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
  MapPinned,
  CalendarClock,
  ListChecks,
} from "lucide-react";
import { useTasks } from "@/providers/TaskProvider";
import { TaskCreateForm } from "@shared/types";
import { Input, PriceInput } from "@/shared/components/Input";
import { TagInput } from "@/shared/components/TagInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { taskCreateSchema } from "@shared/schemas";
import { axiosApi } from "api/index";
import { DatePicker } from "@/shared/components/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/shared/components/LocationPicker";
import { SectionLabel } from "@/screens/tasks/ui";

const INITIAL_STATE: TaskCreateForm = {
  title: "",
  description: "",
  deadline: new Date(),
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
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = <K extends keyof TaskCreateForm>(
    key: K,
    value: TaskCreateForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    try {
      e.preventDefault();
      setError(null);
      const parsed = taskCreateSchema.safeParse(form);
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
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
    } catch {
      setError("Failed to create the task. Please try again.");
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Task title</Label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={(e) => handleUpdate("title", e.target.value)}
                  placeholder="e.g. Assemble an IKEA wardrobe"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleUpdate("description", e.target.value)}
                  placeholder="Describe what needs to be done, the scope of work, and any important details."
                  rows={8}
                  className="resize-none"
                />
              </div>
              <SectionLabel icon={MapPinned}>Location</SectionLabel>
              <LocationPicker
                value={form.location}
                onChange={(location) => handleUpdate("location", location)}
              />
            </div>
            <div className="flex flex-col gap-5">
              <SectionLabel icon={CalendarClock}>
                Schedule & budget
              </SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deadline">Deadline</Label>
                  <DatePicker
                    onChange={(date) => handleUpdate("deadline", date)}
                    value={form.deadline}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount">Budget</Label>
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
                value={form.skills}
                onChange={(v) => handleUpdate("skills", v)}
                placeholder="Search or add a skill..."
                name="skills"
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
            {error && <p className="mb-4 text-sm text-red">{error}</p>}
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
