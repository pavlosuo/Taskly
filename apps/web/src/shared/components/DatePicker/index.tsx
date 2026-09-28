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

export function DatePicker({
  value: date,
  onChange: setDate,
  className,
  error,
}: {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  error?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger className="w-full" asChild>
        <Button
          variant={"outline"}
          data-empty={!date}
          className={clsx(
            "h-10 text-sm justify-between gap-2 text-left",
            className,
            error ? "border-red focus-visible:ring-red/75" : "border-border",
          )}
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={date}
          required
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </PopoverContent>
    </Popover>
  );
}
