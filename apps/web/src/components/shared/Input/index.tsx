import { Input as InputInitial } from "@/components/ui/input";
import clsx from "clsx";
import { forwardRef, useMemo } from "react";
import { PhoneInput } from "./phone";
import { TagInput } from "./tag";
export * from "./iban";
import { useTheme } from "@/providers/ThemeProvider";
export { PhoneInput, TagInput };
import { MAX_PRICE } from "shared/data";

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
          error
            ? "border-destructive focus-visible:ring-destructive/75"
            : "border-border",
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
  currency?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {
      name,
      value,
      onChange,
      placeholder = "Budget",
      className,
      currency = "EUR",
      onBlur,
      error,
    },
    ref,
  ) => {
    const { lang } = useTheme();

    const { formatter, symbol, symbolFirst } = useMemo(() => {
      const parts = new Intl.NumberFormat(lang, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).formatToParts(1);

      const currencyIdx = parts.findIndex((p) => p.type === "currency");
      const integerIdx = parts.findIndex((p) => p.type === "integer");

      return {
        formatter: new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }),
        symbol: parts[currencyIdx]?.value ?? currency,
        symbolFirst: currencyIdx < integerIdx,
      };
    }, [lang, currency]);

    const sanitize = (raw: string): number => {
      const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
      return digits === "" ? 0 : Math.min(Number(digits), MAX_PRICE);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(sanitize(e.target.value));
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          name={name}
          type="text"
          inputMode="numeric"
          value={value ? formatter.format(value) : ""}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={clsx(symbolFirst ? "pl-8" : "pr-8", className)}
          error={error}
        />
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-foreground",
            symbolFirst ? "left-3" : "right-3",
          )}
        >
          {symbol}
        </span>
      </div>
    );
  },
);

PriceInput.displayName = "PriceInput";
