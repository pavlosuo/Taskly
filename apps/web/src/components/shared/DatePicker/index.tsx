"use client";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import clsx from "clsx";
import { useTheme } from "@/providers/ThemeProvider";
import { Clock2Icon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { enUS, fi, sv, Locale } from "react-day-picker/locale";
import { Lang, Deadline } from "shared/index";
import { useTranslation } from "react-i18next";

const locales: Record<Lang, Locale> = {
  en: enUS,
  "fi-FI": fi,
  "sv-FI": sv,
};

export function CalendarWithTime({
  value,
  onChange,
}: {
  value: Deadline;
  onChange: (v: Deadline) => void;
}) {
  const { lang } = useTheme();
  const { t } = useTranslation("tasks");
  return (
    <Card>
      <CardContent>
        <Calendar
          mode="single"
          selected={value?.date ?? undefined}
          onSelect={(e) => onChange({ ...value, date: e })}
          defaultMonth={value?.date ?? undefined}
          required
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          locale={locales[lang]}
          className="p-0"
        />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="time-end">{t("endTime")}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="time-end"
                type="time"
                value={value?.time ?? ""}
                onChange={(e) => onChange({ ...value, time: e.target.value })}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon>
                <Clock2Icon className="text-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

export function DatePicker({
  value,
  onChange,
  className,
  error,
}: {
  value: Deadline;
  onChange: (v: Deadline) => void;
  className?: string;
  error?: string;
}) {
  const { lang } = useTheme();
  const { t } = useTranslation("tasks");
  return (
    <Popover>
      <PopoverTrigger className="w-full bg-transparent" asChild>
        <Button
          variant={"outline"}
          data-empty={!value}
          className={clsx(
            "h-10 text-sm justify-between gap-2 text-left transition-none",
            className,
            error
              ? "border-destructive focus-visible:ring-destructive/75"
              : "border-border",
          )}
        >
          {value?.date ? (
            format(value.date, "PPP", { locale: locales[lang] })
          ) : (
            <span>{t("pickDate")}</span>
          )}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarWithTime value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
