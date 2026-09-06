import { Input as InputInitial } from "@/components/ui/input";
import clsx from "clsx";
import { forwardRef } from "react";

interface Props {
  name: string;
  autoComplete?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
