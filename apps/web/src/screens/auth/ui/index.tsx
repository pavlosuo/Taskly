import { memo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { OtpChannel } from "@shared/types";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Label as LabelPrimitive } from "@/components/ui/label";
import clsx from "clsx";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full md:h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full h-full overflow-hidden grid grid-cols-[100%] md:grid-cols-2 md:max-w-360 md:max-h-200">
        <FormPanel>{children}</FormPanel>
        <ImagePanel />
      </div>
    </div>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[24px] md:text-[42px] font-bold text-foreground mb-4 tracking-tight leading-6.5 md:leading-10">
      {children}
    </h1>
  );
}

export function Label({
  children,
  error,
  htmlFor,
}: {
  children: React.ReactNode;
  error?: boolean;
  htmlFor?: string;
}) {
  return (
    <LabelPrimitive
      htmlFor={htmlFor}
      className={clsx(
        "text-sm font-medium mb-1.5 block",
        error ? "text-red" : "text-grey",
      )}
    >
      {children}
    </LabelPrimitive>
  );
}

export function FormPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col mb-10 px-0 py-0 md:px-8 md:mb-0 md:py-10 md:overflow-y-auto relative">
      <div className="flex-1 flex flex-col justify-center max-w-110 mx-auto w-full">
        {children}
      </div>
    </div>
  );
}

export function ImagePanel() {
  return (
    <div className="rounded-2xl relative flex items-center justify-center aspect-square w-full md:aspect-auto md:h-full overflow-hidden">
      <Image
        className="w-full h-full object-contain"
        src="/assets/login.svg"
        alt="Login Image"
        width={720}
        height={800}
        fetchPriority="high"
        priority
      />
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red mt-1">{message}</p>;
}

export const PasswordToggle = memo(function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/90"
    >
      {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
});

export const BottomLink = memo(function BottomLink({
  text,
  label,
  onClick,
}: {
  text: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <p className="text-sm text-gray mt-6 text-left">
      {text}{" "}
      <button
        type="button"
        onClick={onClick}
        className="text-primary hover:text-primary/90 font-medium hover:underline"
      >
        {label}
      </button>
    </p>
  );
});

export const MethodToggle = memo(function MethodToggle({
  method,
  onChange,
}: {
  method: OtpChannel;
  onChange: (m: OtpChannel) => void;
}) {
  return (
    <div className="flex gap-1 mb-6">
      {(["phone", "email"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`flex-1 h-8 rounded-md text-sm font-medium transition-colors ${
            method === m
              ? "bg-primary text-white hover:bg-primary/90"
              : "text-gray hover:text-grey hover:bg-input"
          }`}
        >
          {m === "phone" ? "Phone" : "Email"}
        </button>
      ))}
    </div>
  );
});
