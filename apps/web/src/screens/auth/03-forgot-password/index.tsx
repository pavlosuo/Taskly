"use client";
import { useState, useCallback, memo, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/shared/components/Input";
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
  NewPasswordForm,
  OtpChannel,
  Step,
  NewPasswordErrors,
} from "@shared/index";
import {
  AuthLayout,
  FieldError,
  PasswordToggle,
  BottomLink,
  MethodToggle,
  Title,
  Label,
} from "@/screens/auth/ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { PhoneInput } from "@/shared/components/PhoneInput";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

export interface ForgotPasswordContextValue {
  step: Step;
  method: OtpChannel;
  phone: string;
  resetToken: string;
  tokenError: { title: string; message: string };
  setStep: (step: Step) => void;
  setMethod: (method: OtpChannel) => void;
  setPhone: (phone: string) => void;
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

const PhoneStep = memo(function PhoneStep() {
  const { t } = useTranslation("forgotPassword");
  const { t: tErrors } = useTranslation("errors");
  const { setStep, setPhone, goToEntry } = useForgotPassword();
  const [error, setError] = useState("");
  const { sendPasswordResetOtp, isLoading } = useUser();
  const router = useRouter();
  const [form, setForm] = useState<{
    phone: string;
    code: string;
    fullPhone: string;
  }>({
    phone: "",
    code: "",
    fullPhone: "",
  });

  const buildFullPhone = useCallback(
    (code: string, phone: string) =>
      `${code ?? ""}${(phone ?? "").replace(/\s/g, "")}`,
    [],
  );

  const handleLocalPhone = useCallback(
    (phone: string) => {
      setError("");
      setForm((p) => ({
        ...p,
        phone,
        fullPhone: buildFullPhone(p.code, phone),
      }));
    },
    [buildFullPhone],
  );

  const handleCodeChange = useCallback(
    (code: string) => {
      setError("");
      setForm((p) => ({
        ...p,
        code,
        fullPhone: buildFullPhone(code, p.phone),
      }));
    },
    [buildFullPhone],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const fullPhone = form.fullPhone;
      const result = sendResetOtpSchema.safeParse({
        fullPhone,
      });
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setError(fieldErrors.fullPhone?.[0] ?? formErrors[0]);
        return;
      }
      try {
        await sendPasswordResetOtp(fullPhone);
        setPhone(fullPhone);
        setStep("otp");
      } catch (err) {
        setError(getAxiosError(err));
      }
    },
    [form, setStep, setPhone, sendPasswordResetOtp],
  );

  return (
    <>
      <Title>{t("phone.title")}</Title>
      <p className="text-sm text-gray mb-6">{t("phone.subtitle")}</p>
      <MethodToggle method="phone" onChange={(m) => goToEntry(m)} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          <FieldError message={error ? tErrors(error) : ""} />
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
  const { t: tErrors } = useTranslation("errors");
  const { t } = useTranslation("forgotPassword");
  const { setStep, goToEntry } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { sendPasswordResetLink, isLoading } = useUser();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = forgotPasswordEmailSchema.safeParse({ email });
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setError(fieldErrors.email?.[0] ?? formErrors[0]);
        return;
      }
      try {
        await sendPasswordResetLink(email);
        setStep("email-sent");
      } catch (err) {
        setError(getAxiosError(err));
      }
    },
    [email, setStep, sendPasswordResetLink],
  );

  return (
    <>
      <Title>{t("email.title")}</Title>
      <p className="text-sm text-gray mb-6">{t("email.subtitle")}</p>
      <MethodToggle method="email" onChange={(m) => goToEntry(m)} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              setError("");
            }}
          />
          <FieldError message={error ? tErrors(error) : ""} />
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
  const { t: tErrors } = useTranslation("errors");
  const { sendPasswordResetOtp, verifyPasswordResetOtp, isLoading } = useUser();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = otpSchema.safeParse({ otp: digits });
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setError(fieldErrors.otp?.[0] ?? formErrors[0]);
        return;
      }
      try {
        const resetToken = await verifyPasswordResetOtp(phone, digits);
        setResetToken(resetToken);
        setStep("new-password");
      } catch (err) {
        setError(getAxiosError(err));
      }
    },
    [digits, phone, setStep, setResetToken, verifyPasswordResetOtp],
  );

  const handleResend = useCallback(async () => {
    setDigits("");
    setError("");
    try {
      await sendPasswordResetOtp(phone);
    } catch (err) {
      setError(getAxiosError(err));
    }
  }, [phone, sendPasswordResetOtp]);

  return (
    <>
      <Title>{t("otp.title")}</Title>
      <p className="text-sm text-gray mb-8">{t("otp.subtitle")}</p>
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
          <FieldError message={error ? tErrors(error) : ""} />
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
        <p className="text-sm text-gray">{t("emailSent.subtitle")}</p>
      </div>
      <div className="bg-primary/5 px-4 py-3 flex gap-1 flex-col">
        <div className="flex items-center gap-1 color">
          <Info className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
          <span className="text-sm text-foreground font-semibold">
            {t("hint.label")}
          </span>
        </div>
        <p className="text-sm text-primary">{t("emailSent.hint")}</p>
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
  const { t: tErrors } = useTranslation("errors");
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
        const { fieldErrors, formErrors } = result.error.flatten();
        setErrors({
          password: fieldErrors.password?.[0],
          confirm: fieldErrors.confirm?.[0],
          general: formErrors[0],
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
      <p className="text-sm text-gray mb-8">{t("newPassword.subtitle")}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {(["password", "confirm"] as const).map((field, i) => (
          <div key={field} className="form-group">
            <Label htmlFor={field} error={!!errors[field]}>
              {t(`newPassword.fields.${field}`)}
            </Label>
            <div className="relative">
              <Input
                error={errors[field]}
                name={field}
                type={show[field] ? "text" : "password"}
                placeholder={t(`newPassword.fields.${field}`)}
                value={form[field]}
                onChange={handleChange(field)}
                className={clsx("pr-10")}
              />
              <PasswordToggle
                show={show[field]}
                onToggle={() => setShow((p) => ({ ...p, [field]: !p[field] }))}
              />
            </div>
            {field === "password" && strength && form.password && (
              <p className={clsx("text-xs mt-1 font-medium", strength.color)}>
                {tErrors(strength.tips[0] ?? strength.label)}
              </p>
            )}
            {errors["confirm"] && i === 0 && (
              <FieldError
                message={errors["confirm"] ? tErrors(errors["confirm"]) : ""}
              />
            )}
            {!errors["confirm"] && (
              <FieldError
                message={errors[field] ? tErrors(errors[field]) : ""}
              />
            )}
            <FieldError message={errors[field] ? tErrors(errors[field]) : ""} />
          </div>
        ))}
        <div className="bg-primary/5 px-4 py-3 flex gap-1 flex-col">
          <div className="flex items-center gap-1 color">
            <Info className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-foreground font-semibold">
              {t("hint.label")}
            </span>
          </div>
          <p className="text-sm text-primary">{t("newPassword.hint")}</p>
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
        <p className="text-sm text-gray">{t("success.subtitle")}</p>
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
        <p className="text-sm text-gray">{tokenError.message}</p>
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
  const [method, setMethod] = useState<OtpChannel>("phone");
  const [phone, setPhone] = useState("");
  const [resetToken, setResetToken] = useState(initialToken ?? "");

  const tokenError = error
    ? { title: errorTitles[error], message: errorMessages[error] }
    : { title: errorTitles["error"], message: errorMessages["error"] };

  const goToEntry = useCallback((m: OtpChannel = "phone") => {
    setMethod(m);
    setStep("entry");
  }, []);

  const entryStep = method === "phone" ? <PhoneStep /> : <EmailStep />;

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
      <AuthLayout>{step === "entry" ? entryStep : STEPS[step]}</AuthLayout>
    </ForgotPasswordContext.Provider>
  );
}
