import { Input as InputInitial } from "@/components/ui/input";
import clsx from "clsx";

interface Props {
  name: string;
  autoComplete?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}

export const Input = ({
  name,
  autoComplete = "off",
  type,
  placeholder,
  value,
  onChange,
  error,
  className,
}: Props) => {
  return (
    <InputInitial
      id={name}
      name={name}
      autoComplete={autoComplete}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={clsx(
        "h-10 text-sm placeholder:text-grey",
        className,
        error ? "border-red focus-visible:ring-red/75" : "border-border",
      )}
    />
  );
};
