"use client";
import { Eye, EyeOff } from "lucide-react";
import { OtpChannel } from "shared/types";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen flex items-center justify-center px-4 pt-6 md:px-6 md:pt-0">
      <div className="w-full h-full overflow-hidden grid grid-cols-[100%] md:grid-cols-2 md:max-w-360 md:max-h-200">
        <FormPanel>{children}</FormPanel>
        <ImagePanel />
      </div>
    </div>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
      {children}
    </h1>
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

export const PasswordToggle = ({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) => {
  const { t } = useTranslation("common");
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={t(show ? "aria.hidePassword" : "aria.showPassword")}
      aria-pressed={show}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/90"
    >
      {show ? (
        <Eye aria-hidden="true" className="w-4 h-4" />
      ) : (
        <EyeOff aria-hidden="true" className="w-4 h-4" />
      )}
    </button>
  );
};

export const BottomLink = ({
  text,
  label,
  onClick,
}: {
  text: string;
  label: string;
  onClick: () => void;
}) => {
  return (
    <p className="text-sm text-grey mt-6 text-left">
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
};

export const MethodToggle = ({
  method,
  onChange,
}: {
  method: OtpChannel;
  onChange: (m: OtpChannel) => void;
}) => {
  const { t } = useTranslation("common");
  return (
    <div className="flex gap-1 mb-6">
      {(["phone", "email"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={method === m}
          onClick={() => onChange(m)}
          className={`flex-1 h-8 rounded-md text-sm font-medium transition-colors ${
            method === m
              ? "bg-primary text-white hover:bg-primary/90"
              : "text-grey hover:text-foreground hover:bg-input"
          }`}
        >
          {t(`method.${m}`)}
        </button>
      ))}
    </div>
  );
};

export function ImagePanel() {
  const { t } = useTranslation("common");
  return (
    <div className="relative flex items-center justify-center aspect-square w-full md:aspect-auto md:h-full overflow-hidden">
      <Image
        className="w-full h-full object-contain"
        src="/assets/login.svg"
        alt={t("alt.authIllustration")}
        width={720}
        height={800}
        fetchPriority="high"
        priority
      />
    </div>
  );
}

export const RegisterLink = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  return (
    <BottomLink
      text={t("auth.noAccount.text")}
      label={t("auth.noAccount.label")}
      onClick={() => router.push("/register")}
    />
  );
};

export const LoginLink = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  return (
    <BottomLink
      text={t("auth.hasAccount.text")}
      label={t("auth.hasAccount.label")}
      onClick={() => router.push("/login")}
    />
  );
};
