"use client";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { startTransition } from "react";
const COUNTRY_PREFIX = "FI";
const IBAN_DIGIT_LENGTH = 16;

export function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

function digitsOf(raw: string) {
  return raw.replace(/\D/g, "").slice(0, IBAN_DIGIT_LENGTH);
}

export function IbanInput({
  value,
  onChange,
  className,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur" | "type" | "inputMode"
>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const digits = digitsOf(value);
  const display = digits ? formatIban(COUNTRY_PREFIX + digits) : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const cursor = el.selectionStart ?? el.value.length;
    const digitsBeforeCursor = el.value
      .slice(0, cursor)
      .replace(/\D/g, "").length;
    const newDigits = digitsOf(el.value);
    onChange(newDigits ? COUNTRY_PREFIX + newDigits : "");
    const newDisplay = newDigits ? formatIban(COUNTRY_PREFIX + newDigits) : "";
    const targetDigitCount = Math.min(digitsBeforeCursor, newDigits.length);
    startTransition(() => {
      const input = inputRef.current;
      if (!input) return;
      let seen = 0;
      let pos = newDisplay.length;
      for (let i = 0; i < newDisplay.length; i++) {
        if (/\d/.test(newDisplay[i])) {
          seen++;
          if (seen === targetDigitCount) {
            pos = i + 1;
            break;
          }
        }
      }
      if (targetDigitCount === 0) pos = newDisplay.length ? 2 : 0;
      input.setSelectionRange(pos, pos);
    });
  };

  const handleBlur = () => {
    if (digits.length > 0 && digits.length < IBAN_DIGIT_LENGTH) {
      onChange("");
    }
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      type="text"
      inputMode="numeric"
      placeholder="FI21 1234 5600 0007 85"
      className={className}
    />
  );
}
