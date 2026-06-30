"use client";
import { useState, useCallback, memo, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Check } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { getPasswordStrength } from "@shared/utils";
import {
  forgotPasswordEmailSchema,
  otpSchema,
  newPasswordSchema,
  sendResetOtpSchema,
} from "@shared/index";
import {
  NewPasswordForm,
  Method,
  Step,
  ForgotPasswordContextValue,
  NewPasswordErrors,
} from "@shared/types";
import {
  AuthLayout,
  FieldError,
  PasswordToggle,
  BottomLink,
  MethodToggle,
  Title,
} from "@/screens/auth/ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { PhoneInput } from "@/shared/components/PhoneInput";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

const ForgotPasswordContext = createContext<ForgotPasswordContextValue | null>(
  null,
);

function useForgotPassword() {
  const ctx = useContext(ForgotPasswordContext);
  if (!ctx)
    throw new Error(
      "useForgotPassword must be used within ForgotPasswordProvider",
    );
  return ctx;
}

const PhoneStep = memo(function PhoneStep() {
  const { t } = useTranslation("forgotPassword");
  const { setStep, setPhone, goToEntry } = useForgotPassword();
  const [phone, setLocalPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { sendResetOtp, isLoading } = useUser();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = sendResetOtpSchema.safeParse({
        phone: code + phone.replace(/\s/g, ""),
      });
      if (!result.success) {
        setError(result.error.format().phone?._errors[0] ?? "");
        return;
      }
      try {
        const fullPhone = code + phone.replace(/\s/g, "");
        await sendResetOtp(fullPhone);
        setPhone(fullPhone);
        setStep("otp");
      } catch (err) {
        setError(getAxiosError(err));
      }
    },
    [phone, code, setStep, setPhone, sendResetOtp],
  );

  return (
    <>
      <Title>{t("phone.title")}</Title>
      <p className="text-sm text-gray mb-6 leading-relaxed">
        {t("phone.subtitle")}
      </p>
      <MethodToggle method="phone" onChange={(m) => goToEntry(m)} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="form-group">
          <Label
            className={clsx(
              "text-sm font-medium mb-1.5 block",
              error ? "text-red" : "text-grey",
            )}
            htmlFor="phone"
          >
            {t("phone.label")}
          </Label>
          <PhoneInput
            error={error}
            value={phone}
            onChange={setLocalPhone}
            setCode={setCode}
            id="phone"
          />
          <FieldError message={error} />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("phone.submit.loading") : t("phone.submit.idle")}
        </Button>
      </form>
      <BottomLink
        text={t("bottomLink.text")}
        label={t("bottomLink.label")}
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const EmailStep = memo(function EmailStep() {
  const { t } = useTranslation("forgotPassword");
  const { setStep, goToEntry } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { sendResetEmail, isLoading } = useUser();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = forgotPasswordEmailSchema.safeParse({ email });
      if (!result.success) {
        setError(result.error.format().email?._errors[0] ?? "");
        return;
      }
      try {
        await sendResetEmail(email);
        setStep("email-sent");
      } catch (err) {
        setError(getAxiosError(err));
      }
    },
    [email, setStep, sendResetEmail],
  );

  return (
    <>
      <Title>{t("email.title")}</Title>
      <p className="text-sm text-gray mb-6 leading-relaxed">
        {t("email.subtitle")}
      </p>
      <MethodToggle method="email" onChange={(m) => goToEntry(m)} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="form-group">
          <Label
            htmlFor="email"
            className={clsx(
              "text-sm font-medium mb-1.5 block",
              error ? "text-red" : "text-grey",
            )}
          >
            {t("email.label")}
          </Label>
          <Input
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            placeholder={t("email.placeholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className={clsx(
              "h-10 rounded-lg text-sm placeholder:text-grey",
              error ? "border-red focus-visible:ring-red-75" : "border-border",
            )}
          />
          <FieldError message={error} />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("email.submit.loading") : t("email.submit.idle")}
        </Button>
      </form>
      <BottomLink
        text={t("bottomLink.text")}
        label={t("bottomLink.label")}
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const OtpStep = memo(function OtpStep() {
  const { t } = useTranslation("forgotPassword");
  const { phone, setStep, setResetToken } = useForgotPassword();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const { sendResetOtp, verifyResetOtp, isLoading } = useUser();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = otpSchema.safeParse({ otp: digits });
      if (!result.success) {
        setError(result.error.format().otp?._errors[0] ?? "");
        return;
      }
      try {
        const resetToken = await verifyResetOtp(phone, digits);
        setResetToken(resetToken);
        setStep("new-password");
      } catch (err) {
        setError(getAxiosError(err));
      }
    },
    [digits, phone, setStep, setResetToken, verifyResetOtp],
  );

  const handleResend = useCallback(async () => {
    setDigits("");
    setError("");
    try {
      await sendResetOtp(phone);
    } catch (err) {
      setError(getAxiosError(err));
    }
  }, [phone, sendResetOtp]);

  return (
    <>
      <Title>{t("otp.title")}</Title>
      <p className="text-sm text-gray mb-8 leading-relaxed">
        {t("otp.subtitle")}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="form-group">
          <InputOTP
            maxLength={6}
            value={digits}
            onChange={(v) => {
              setDigits(v);
              setError("");
            }}
          >
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:text-xl">
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError message={error} />
        </div>
        <p className="text-sm text-gray">
          {t("otp.resendText")}{" "}
          <button
            type="button"
            onClick={handleResend}
            className="text-primary hover:text-primary/90 font-medium hover:underline"
          >
            {t("otp.resendLink")}
          </button>
        </p>
        <Button type="submit" disabled={isLoading || digits.length < 6}>
          {isLoading ? t("otp.submit.loading") : t("otp.submit.idle")}
        </Button>
      </form>
      <BottomLink
        text={t("bottomLink.text")}
        label={t("bottomLink.label")}
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const EmailSentStep = memo(function EmailSentStep() {
  const { t } = useTranslation("forgotPassword");
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
        <Check className="w-5 h-5 text-primary" />
      </div>
      <div className="form-group">
        <Title>{t("emailSent.title")}</Title>
        <p className="text-sm text-gray leading-relaxed">
          {t("emailSent.subtitle")}
        </p>
      </div>
      <div className="rounded-lg bg-primary/5 px-4 py-3 flex gap-1 flex-col">
        <div className="flex items-center gap-1 color">
          <Info className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
          <span className="text-sm text-foreground font-semibold">
            {t("hint.label")}
          </span>
        </div>
        <p className="text-sm text-primary leading-relaxed">
          {t("emailSent.hint")}
        </p>
      </div>
      <Button onClick={() => router.push("/login")}>
        {t("emailSent.backToLogin")}
      </Button>
    </div>
  );
});

const NewPasswordStep = memo(function NewPasswordStep() {
  const { t } = useTranslation("forgotPassword");
  const { resetToken, setStep } = useForgotPassword();
  const [form, setForm] = useState<NewPasswordForm>({
    password: "",
    confirm: "",
  });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState<NewPasswordErrors>({});
  const strength = getPasswordStrength(form.password);
  const { resetPassword, isLoading } = useUser();
  const router = useRouter();

  const handleChange = useCallback(
    (field: keyof NewPasswordForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
      },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = newPasswordSchema.safeParse(form);
      if (!result.success) {
        const fmt = result.error.format();
        setErrors({
          password: fmt.password?._errors[0],
          confirm: fmt.confirm?._errors[0] ?? fmt._errors[0],
        });
        return;
      }
      try {
        await resetPassword(resetToken, form.password);
        setStep("success");
      } catch (err) {
        setErrors({ general: getAxiosError(err) });
      }
    },
    [form, resetToken, setStep, resetPassword],
  );

  return (
    <>
      <Title>{t("newPassword.title")}</Title>
      <p className="text-sm text-gray mb-8 leading-relaxed">
        {t("newPassword.subtitle")}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {(["password", "confirm"] as const).map((field) => (
          <div key={field} className="form-group">
            <Label
              htmlFor={field}
              className={clsx(
                "text-sm font-medium mb-1.5 block",
                errors[field] ? "text-red" : "text-grey",
              )}
            >
              {t(`newPassword.fields.${field}`)}
            </Label>
            <div className="relative">
              <Input
                id={field}
                name={field}
                type={show[field] ? "text" : "password"}
                placeholder={t(`newPassword.fields.${field}`)}
                value={form[field]}
                onChange={handleChange(field)}
                className={clsx(
                  "h-10 rounded-lg text-sm placeholder:text-grey pr-10",
                  errors[field]
                    ? "border-red focus-visible:ring-red-75"
                    : "border-border",
                )}
              />
              <PasswordToggle
                show={show[field]}
                onToggle={() => setShow((p) => ({ ...p, [field]: !p[field] }))}
              />
            </div>
            {field === "password" && strength && form.password && (
              <p className={clsx("text-xs mt-1 font-medium", strength.color)}>
                {strength.tips[0] ?? strength.label}
              </p>
            )}
            <FieldError message={errors[field]} />
          </div>
        ))}
        <div className="rounded-lg bg-primary/5 px-4 py-3 flex gap-1 flex-col">
          <div className="flex items-center gap-1 color">
            <Info className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-foreground font-semibold">
              {t("hint.label")}
            </span>
          </div>
          <p className="text-sm text-primary leading-relaxed">
            {t("newPassword.hint")}
          </p>
        </div>
        {errors.general && <p className="text-xs text-red">{errors.general}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t("newPassword.submit.loading")
            : t("newPassword.submit.idle")}
        </Button>
      </form>
      <BottomLink
        text={t("bottomLink.text")}
        label={t("bottomLink.label")}
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const SuccessStep = memo(function SuccessStep() {
  const { t } = useTranslation("forgotPassword");
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
        <Check className="w-5 h-5 text-primary" />
      </div>
      <div className="form-group">
        <Title>{t("success.title")}</Title>
        <p className="text-sm text-gray leading-relaxed">
          {t("success.subtitle")}
        </p>
      </div>
      <Button onClick={() => router.push("/login")}>
        {t("success.signIn")}
      </Button>
    </div>
  );
});

const TokenErrorStep = memo(function TokenErrorStep() {
  const { t } = useTranslation("forgotPassword");
  const { tokenError, goToEntry } = useForgotPassword();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Title>{tokenError.title}</Title>
        <p className="text-sm text-gray leading-relaxed">
          {tokenError.message}
        </p>
      </div>
      <Button
        onClick={() => {
          goToEntry("email");
          router.replace("/forgot-password");
        }}
      >
        {t("tokenError.requestNew")}
      </Button>
    </div>
  );
});

const STEPS: Partial<Record<Step, () => React.ReactNode>> = {
  otp: () => <OtpStep />,
  "new-password": () => <NewPasswordStep />,
  success: () => <SuccessStep />,
  "email-sent": () => <EmailSentStep />,
  "token-error": () => <TokenErrorStep />,
};

export function ForgotPassword({
  initialToken,
  error,
}: {
  initialToken?: string;
  error?: "expired" | "invalid" | "error";
}) {
  const { t } = useTranslation("forgotPassword");

  const errorMessages = {
    expired: t("tokenError.messages.expired"),
    invalid: t("tokenError.messages.invalid"),
    error: t("tokenError.messages.error"),
  };

  const errorTitles = {
    expired: t("tokenError.titles.expired"),
    invalid: t("tokenError.titles.invalid"),
    error: t("tokenError.titles.error"),
  };

  const [step, setStep] = useState<Step>(
    initialToken ? "new-password" : error ? "token-error" : "entry",
  );
  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [resetToken, setResetToken] = useState(initialToken ?? "");
  const [tokenError] = useState(
    error
      ? { title: errorTitles[error], message: errorMessages[error] }
      : { title: errorTitles["error"], message: errorMessages["error"] },
  );

  const goToEntry = useCallback((m: Method = "phone") => {
    setMethod(m);
    setStep("entry");
  }, []);

  const entryStep = method === "phone" ? <PhoneStep /> : <EmailStep />;
  const CurrentStep = step !== "entry" ? STEPS[step] : undefined;

  return (
    <ForgotPasswordContext.Provider
      value={{
        step,
        method,
        phone,
        resetToken,
        tokenError,
        setStep,
        setMethod,
        setPhone,
        setResetToken,
        goToEntry,
      }}
    >
      <AuthLayout>{step === "entry" ? entryStep : CurrentStep?.()}</AuthLayout>
    </ForgotPasswordContext.Provider>
  );
}
