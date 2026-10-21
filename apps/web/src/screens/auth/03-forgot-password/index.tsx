"use client";
import {
  useState,
  useCallback,
  useMemo,
  memo,
  createContext,
  useContext,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Info, Check } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Input, PhoneInput } from "@/components/shared/Input";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  forgotPasswordEmailSchema,
  otpSchema,
  newPasswordSchema,
  sendResetOtpSchema,
  NewPasswordForm,
  OtpChannel,
  Step,
  ZodErrors,
  RESET_LINK_TTL_MINUTES,
  getPasswordStrength,
  RESEND_COOLDOWN_SECONDS,
  TokenErrorType,
} from "shared/index";
import {
  AuthLayout,
  PasswordToggle,
  RegisterLink,
  MethodToggle,
  Title,
} from "@/screens/auth/ui";
import { usePhoneFields } from "@/hooks/usePhoneFields";
import { useToast } from "@/hooks/useToast";

export interface ForgotPasswordContextValue {
  step: Step;
  method: OtpChannel;
  phone: string;
  email: string;
  resetToken: string;
  tokenErrorType: TokenErrorType;
  setStep: (step: Step) => void;
  setMethod: (method: OtpChannel) => void;
  setPhone: (phone: string) => void;
  setEmail: (email: string) => void;
  setResetToken: (token: string) => void;
  goToEntry: (m?: OtpChannel) => void;
}

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

const HintBox = memo(function HintBox({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-primary/5 px-4 py-3 flex gap-1 flex-col">
      <div className="flex items-center gap-1">
        <Info
          aria-hidden="true"
          className="w-4 h-4 text-foreground mt-0.5 shrink-0"
        />
        <span className="text-sm text-foreground font-semibold">
          {t("hint.label")}
        </span>
      </div>
      <p className="text-sm text-primary">{children}</p>
    </div>
  );
});

const StatusIcon = memo(function StatusIcon() {
  return (
    <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
      <Check aria-hidden="true" className="w-5 h-5 text-primary" />
    </div>
  );
});

const PhoneStep = memo(function PhoneStep() {
  const { t } = useTranslation("forgotPassword");
  const { setStep, setPhone, goToEntry } = useForgotPassword();
  const { sendPasswordResetOtp, isLoading } = useUser();
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({ phone: "", code: "", fullPhone: "" });
  const clearError = useCallback(() => setError(undefined), []);
  const { handleLocalPhone, handleCodeChange } = usePhoneFields(
    setForm,
    clearError,
  );
  const toast = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = sendResetOtpSchema.safeParse({
        fullPhone: form.fullPhone,
      });
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setError(fieldErrors.fullPhone?.[0]);
        toast(formErrors[0]);
        return;
      }
      try {
        await sendPasswordResetOtp(form.fullPhone);
        setPhone(form.fullPhone);
        setStep("otp");
      } catch {}
    },
    [form.fullPhone, setStep, setPhone, sendPasswordResetOtp, toast],
  );

  return (
    <>
      <Title>{t("entry.title")}</Title>
      <p className="text-sm text-grey mb-6">{t("phone.subtitle")}</p>
      <MethodToggle method="phone" onChange={(m) => goToEntry(m)} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="form-group">
          <Label error={!!error} htmlFor="phone">
            {t("phone.label")}
          </Label>
          <PhoneInput
            error={error}
            value={form.phone}
            onChange={handleLocalPhone}
            setCode={handleCodeChange}
            id="phone"
          />
          <FieldError message={error} />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("phone.submit.loading") : t("phone.submit.idle")}
        </Button>
      </form>
      <RegisterLink />
    </>
  );
});

const EmailStep = memo(function EmailStep() {
  const { t } = useTranslation("forgotPassword");
  const { setStep, setEmail: saveEmail, goToEntry } = useForgotPassword();
  const { sendPasswordResetLink, isLoading } = useUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const toast = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = forgotPasswordEmailSchema.safeParse({ email });
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setError(fieldErrors.email?.[0]);
        toast(formErrors[0]);
        return;
      }
      try {
        await sendPasswordResetLink(email);
        saveEmail(email);
        setStep("email-sent");
      } catch {}
    },
    [email, setStep, saveEmail, sendPasswordResetLink, toast],
  );

  return (
    <>
      <Title>{t("entry.title")}</Title>
      <p className="text-sm text-grey mb-6">{t("email.subtitle")}</p>
      <MethodToggle method="email" onChange={(m) => goToEntry(m)} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="form-group">
          <Label htmlFor="email" error={!!error}>
            {t("email.label")}
          </Label>
          <Input
            error={error}
            name="email"
            autoComplete="email"
            type="email"
            placeholder={t("email.placeholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(undefined);
            }}
          />
          <FieldError message={error} />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("email.submit.loading") : t("email.submit.idle")}
        </Button>
      </form>
      <RegisterLink />
    </>
  );
});

const OtpStep = memo(function OtpStep() {
  const { t } = useTranslation("forgotPassword");
  const { phone, setStep, setResetToken } = useForgotPassword();
  const { sendPasswordResetOtp, verifyPasswordResetOtp, isLoading } = useUser();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string>();
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const toast = useToast();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = otpSchema.safeParse({ otp: digits });
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setError(fieldErrors.otp?.[0]);
        toast(formErrors[0]);
        return;
      }
      try {
        const resetToken = await verifyPasswordResetOtp(phone, digits);
        setResetToken(resetToken);
        setStep("new-password");
      } catch {}
    },
    [digits, phone, setStep, setResetToken, verifyPasswordResetOtp, toast],
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setDigits("");
    setError(undefined);
    setResent(false);
    try {
      await sendPasswordResetOtp(phone);
      setResent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {}
  }, [cooldown, phone, sendPasswordResetOtp]);

  return (
    <>
      <Title>{t("otp.title", { phone })}</Title>
      <p className="text-sm text-grey mb-8">{t("otp.subtitle")}</p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="form-group">
          <InputOTP
            maxLength={6}
            value={digits}
            aria-label={t("otp.label")}
            aria-invalid={!!error}
            onChange={(v) => {
              setDigits(v);
              setError(undefined);
              setResent(false);
            }}
          >
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:text-xl">
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError message={error} />
          {resent && (
            <p role="status" className="text-xs mt-1 text-success">
              {t("otp.resent", { phone })}
            </p>
          )}
        </div>
        <p className="text-sm text-grey">
          {t("otp.resendText")}{" "}
          {cooldown > 0 ? (
            <span>{t("otp.resendIn", { seconds: cooldown })}</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-primary hover:text-primary/90 font-medium hover:underline"
            >
              {t("otp.resendLink")}
            </button>
          )}
        </p>
        <Button type="submit" disabled={isLoading || digits.length < 6}>
          {isLoading ? t("otp.submit.loading") : t("otp.submit.idle")}
        </Button>
      </form>
      <RegisterLink />
    </>
  );
});

const EmailSentStep = memo(function EmailSentStep() {
  const { t } = useTranslation("forgotPassword");
  const { email, goToEntry } = useForgotPassword();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <StatusIcon />
      <div className="form-group">
        <Title>{t("emailSent.title")}</Title>
        <p className="text-sm text-grey">
          {t("emailSent.subtitle", {
            email,
            minutes: RESET_LINK_TTL_MINUTES,
          })}
        </p>
      </div>
      <HintBox>
        {t("emailSent.hint")}{" "}
        <button
          type="button"
          onClick={() => goToEntry("email")}
          className="font-medium underline hover:text-primary/90"
        >
          {t("emailSent.tryAgain")}
        </button>
      </HintBox>
      <Button onClick={() => router.push("/login")}>
        {t("emailSent.backToLogin")}
      </Button>
    </div>
  );
});

const NewPasswordStep = memo(function NewPasswordStep() {
  const { t } = useTranslation(["forgotPassword", "errors"]);
  const { resetToken, setStep } = useForgotPassword();
  const { resetPassword, isLoading } = useUser();
  const [form, setForm] = useState<NewPasswordForm>({
    password: "",
    confirm: "",
  });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState<ZodErrors<NewPasswordForm>>({});
  const strength = getPasswordStrength(form.password);
  const toast = useToast();

  const handleChange = useCallback(
    (field: keyof NewPasswordForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
      },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = newPasswordSchema.safeParse(form);
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setErrors({
          password: fieldErrors.password?.[0],
          confirm: fieldErrors.confirm?.[0],
        });
        toast(formErrors[0]);
        return;
      }
      try {
        await resetPassword(resetToken, form.password);
        setStep("success");
      } catch {}
    },
    [form, resetToken, setStep, resetPassword, toast],
  );

  return (
    <>
      <Title>{t("newPassword.title")}</Title>
      <p className="text-sm text-grey mb-8">{t("newPassword.subtitle")}</p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {(["password", "confirm"] as const).map((field) => {
          const error = errors[field] as string | undefined;
          return (
            <div key={field} className="form-group">
              <Label htmlFor={field} error={!!error}>
                {t(`newPassword.fields.${field}.label`)}
              </Label>
              <div className="relative">
                <Input
                  error={error}
                  name={field}
                  autoComplete="new-password"
                  type={show[field] ? "text" : "password"}
                  placeholder={t(`newPassword.fields.${field}.placeholder`)}
                  value={form[field]}
                  onChange={handleChange(field)}
                  className="pr-10"
                />
                <PasswordToggle
                  show={show[field]}
                  onToggle={() =>
                    setShow((p) => ({ ...p, [field]: !p[field] }))
                  }
                />
              </div>
              {field === "password" && !error && strength && (
                <>
                  <p
                    className={clsx("text-xs mt-1 font-medium", strength.color)}
                  >
                    {t(strength.label, { ns: "errors" })}
                  </p>
                  <FieldError hint message={strength.tips[0]} />
                </>
              )}
              <FieldError message={error} />
            </div>
          );
        })}
        <HintBox>{t("newPassword.hint")}</HintBox>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t("newPassword.submit.loading")
            : t("newPassword.submit.idle")}
        </Button>
      </form>
      <RegisterLink />
    </>
  );
});

const SuccessStep = memo(function SuccessStep() {
  const { t } = useTranslation("forgotPassword");
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <StatusIcon />
      <div className="form-group">
        <Title>{t("success.title")}</Title>
        <p className="text-sm text-grey">{t("success.subtitle")}</p>
      </div>
      <Button onClick={() => router.push("/login")}>
        {t("success.signIn")}
      </Button>
    </div>
  );
});

const TokenErrorStep = memo(function TokenErrorStep() {
  const { t } = useTranslation("forgotPassword");
  const { tokenErrorType, goToEntry } = useForgotPassword();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Title>{t(`tokenError.titles.${tokenErrorType}`)}</Title>
        <p className="text-sm text-grey">
          {t(`tokenError.messages.${tokenErrorType}`)}
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

const STEPS: Partial<Record<Step, React.ReactNode>> = {
  otp: <OtpStep />,
  "new-password": <NewPasswordStep />,
  success: <SuccessStep />,
  "email-sent": <EmailSentStep />,
  "token-error": <TokenErrorStep />,
};

export function ForgotPassword({
  initialToken,
  error,
}: {
  initialToken?: string;
  error?: TokenErrorType;
}) {
  const [step, setStep] = useState<Step>(
    initialToken ? "new-password" : error ? "token-error" : "entry",
  );
  const [method, setMethod] = useState<OtpChannel>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(initialToken ?? "");

  const goToEntry = useCallback((m: OtpChannel = "phone") => {
    setMethod(m);
    setStep("entry");
  }, []);

  const value = useMemo(
    () => ({
      step,
      method,
      phone,
      email,
      resetToken,
      tokenErrorType: error ?? "invalid",
      setStep,
      setMethod,
      setPhone,
      setEmail,
      setResetToken,
      goToEntry,
    }),
    [step, method, phone, email, resetToken, error, goToEntry],
  );

  const entryStep = method === "phone" ? <PhoneStep /> : <EmailStep />;

  return (
    <ForgotPasswordContext.Provider value={value}>
      <AuthLayout>{step === "entry" ? entryStep : STEPS[step]}</AuthLayout>
    </ForgotPasswordContext.Provider>
  );
}
