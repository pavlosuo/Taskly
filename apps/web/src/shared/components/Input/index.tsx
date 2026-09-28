import { Input as InputInitial } from "@/components/ui/input";
import clsx from "clsx";
import { forwardRef } from "react";

interface Props {
  name: string;
  autoComplete?: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputMode?:
    | "search"
    | "text"
    | "email"
    | "tel"
    | "url"
    | "none"
    | "numeric"
    | "decimal"
    | undefined;
  pattern?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  (
    {
      name,
      autoComplete = "off",
      type,
      placeholder,
      value,
      onChange,
      error,
      className,
      onKeyDown,
      onBlur,
      inputMode,
      pattern,
    },
    ref,
  ) => {
    return (
      <InputInitial
        ref={ref}
        id={name}
        name={name}
        autoComplete={autoComplete}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        inputMode={inputMode}
        pattern={pattern}
        className={clsx(
          "h-10 text-sm placeholder:text-grey",
          className,
          error ? "border-red focus-visible:ring-red/75" : "border-border",
        )}
      />
    );
  },
);

Input.displayName = "Input";

interface PriceInputProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  (
    { name, value, onChange, placeholder = "Budget", className, onBlur, error },
    ref,
  ) => {
    const sanitize = (raw: string): number => {
      let digits = raw.replace(/[^\d]/g, "");
      digits = digits.replace(/^0+(?=\d)/, "");
      return digits === "" ? 0 : Number(digits);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numeric = sanitize(e.target.value);
      onChange(numeric);
    };

    return (
      <Input
        ref={ref}
        name={name}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        error={error}
      />
    );
  },
);

PriceInput.displayName = "PriceInput";
