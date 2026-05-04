"use client";
import { useState, useCallback, memo, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "providers/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Check } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { getPasswordStrength } from "@/utils/getPasswordStrength";
import {
  forgotPasswordEmailSchema,
  otpSchema,
  newPasswordSchema,
  sendResetOtpSchema,
} from "../../../../include/schemas";
import { NewPasswordForm, Method, Step } from "@/types";
import {
  AuthLayout,
  FieldError,
  PasswordToggle,
  BottomLink,
  MethodToggle,
} from "../ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { PhoneInput } from "@/shared/components/PhoneInput";
import clsx from "clsx";

type NewPasswordErrors = {
  password?: string;
  confirm?: string;
  general?: string;
};

const errorMessages = {
  expired: "Your reset link has expired. Please request a new one.",
  invalid: "This reset link is invalid. Please request a new one.",
  error: "Something went wrong. Please try again.",
} satisfies Record<"expired" | "invalid" | "error", string>;

const errorTitles = {
  expired: "Link expired",
  invalid: "Invalid link",
  error: "Something went wrong",
} satisfies Record<"expired" | "invalid" | "error", string>;

interface ForgotPasswordContextValue {
  step: Step;
  method: Method;
  phone: string;
  resetToken: string;
  tokenError: { title: string; message: string };
  setStep: (step: Step) => void;
  setMethod: (method: Method) => void;
  setPhone: (phone: string) => void;
  setResetToken: (token: string) => void;
  goToEntry: (m?: Method) => void;
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
      <h1 className="text-[28px] font-bold text-foreground mb-1 tracking-tight">
        Reset password
      </h1>
      <p className="text-sm text-gray mb-6 leading-relaxed">
        Enter your phone number — we&apos;ll send a code via WhatsApp.
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
            Phone number
          </Label>
          <PhoneInput
            error={error}
            value={phone}
            onChange={setLocalPhone}
            code={code}
            setCode={setCode}
            id="phone"
          />
          <FieldError message={error} />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-primary text-white text-sm font-medium"
        >
          {isLoading ? "Sending..." : "Send code"}
        </Button>
      </form>
      <BottomLink
        text="Don't have an account yet?"
        label="Create now"
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const EmailStep = memo(function EmailStep() {
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
      <h1 className="text-[28px] font-bold text-foreground mb-1 tracking-tight">
        Reset password
      </h1>
      <p className="text-sm text-gray mb-6 leading-relaxed">
        Enter your email — we&apos;ll send a reset link.
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
            Email
          </Label>
          <Input
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            placeholder="Enter your email"
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
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-primary text-white text-sm font-medium"
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <BottomLink
        text="Don't have an account yet?"
        label="Create now"
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const OtpStep = memo(function OtpStep() {
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
      <h1 className="text-[28px] font-bold text-foreground mb-1 tracking-tight leading-tight">
        Verification code sent to your WhatsApp
      </h1>
      <p className="text-sm text-gray mb-8 leading-relaxed">
        Please enter the code you received below.
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
          {"Didn't get a code? "}
          <button
            type="button"
            onClick={handleResend}
            className="text-primary hover:text-primary/90 font-medium hover:underline"
          >
            Send again
          </button>
        </p>
        <Button
          type="submit"
          disabled={isLoading || digits.length < 6}
          className="h-10 w-full rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying..." : "Continue"}
        </Button>
      </form>
      <BottomLink
        text="Don't have an account yet?"
        label="Create now"
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const EmailSentStep = memo(function EmailSentStep() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
        <Check className="w-5 h-5 text-primary" />
      </div>
      <div className="form-group">
        <h1 className="text-[28px] font-bold text-foreground mb-2 tracking-tight leading-tight">
          Check your email
        </h1>
        <p className="text-sm text-gray leading-relaxed">
          We&apos;ve sent a password reset link to your email address. The link
          will expire in 30 minutes.
        </p>
      </div>
      <div className="rounded-lg bg-primary/5 px-4 py-3 flex gap-1 flex-col">
        <div className="flex items-center gap-1 color">
          <Info className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
          <span className="text-sm text-foreground font-semibold">Hint</span>
        </div>
        <p className="text-sm text-primary leading-relaxed">
          Didn&apos;t receive it? Check your spam folder or try again with a
          different method.
        </p>
      </div>
      <Button
        onClick={() => router.push("/login")}
        className="h-10 w-full rounded-lg bg-primary text-white text-sm font-medium"
      >
        Back to sign in
      </Button>
    </div>
  );
});

const NewPasswordStep = memo(function NewPasswordStep() {
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
      <h1 className="text-[28px] font-bold text-foreground mb-1 tracking-tight">
        Create new password
      </h1>
      <p className="text-sm text-gray mb-8 leading-relaxed">
        Create a new strong password for your account.
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
              {field === "password" ? "New password" : "Repeat new password"}
            </Label>
            <div className="relative">
              <Input
                id={field}
                name={field}
                type={show[field] ? "text" : "password"}
                placeholder={
                  field === "password" ? "New password" : "Repeat new password"
                }
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
            <span className="text-sm text-foreground font-semibold">Hint</span>
          </div>
          <p className="text-sm text-primary leading-relaxed">
            {`The password should be at least twelve characters long. To make it stronger, use upper and lower case letters, numbers, and symbols like ! " ? $ % ^ & ).`}
          </p>
        </div>
        {errors.general && <p className="text-xs text-red">{errors.general}</p>}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </form>
      <BottomLink
        text="Don't have an account yet?"
        label="Create now"
        onClick={() => router.push("/register")}
      />
    </>
  );
});

const SuccessStep = memo(function SuccessStep() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
        <Check className="w-5 h-5 text-primary" />
      </div>
      <div className="form-group">
        <h1 className="text-[28px] font-bold text-foreground mb-2 tracking-tight leading-tight">
          Password changed successfully
        </h1>
        <p className="text-sm text-gray leading-relaxed">
          You can now sign in with your new password.
        </p>
      </div>
      <Button
        onClick={() => router.push("/login")}
        className="h-10 w-full rounded-lg bg-primary text-white text-sm font-medium"
      >
        Sign in
      </Button>
    </div>
  );
});

const TokenErrorStep = memo(function TokenErrorStep() {
  const { tokenError, goToEntry } = useForgotPassword();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold text-foreground mb-2 tracking-tight leading-tight">
          {tokenError.title}
        </h1>
        <p className="text-sm text-gray leading-relaxed">
          {tokenError.message}
        </p>
      </div>
      <Button
        onClick={() => {
          goToEntry("email");
          router.replace("/forgot-password");
        }}
        className="h-10 w-full rounded-lg bg-primary text-white text-sm font-medium"
      >
        Request a new link
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
