"use client";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { CalendarCheck, UserPlus, ArrowLeftToLine } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Input, PhoneInput } from "@/components/shared/Input";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";
import { FlyingParticles } from "@/components/shared/FlyingParticles";
import { PrivacyPolicyPublic } from "@/components/shared/PrivacyPolicy";
import {
  registerSchema,
  RegisterForm,
  Role,
  ZodErrors,
  getPasswordStrength,
} from "shared/index";
import {
  AuthLayout,
  PasswordToggle,
  LoginLink,
  Title,
} from "@/screens/auth/ui";
import { usePhoneFields } from "@/hooks/usePhoneFields";
import { useToast } from "@/hooks/useToast";

const ROLES: { id: Role; Icon: typeof UserPlus }[] = [
  { id: "client", Icon: UserPlus },
  { id: "tasker", Icon: CalendarCheck },
];

const ROLE_STYLES: Record<
  Role,
  { card: string; active: string; text: string; particles: string }
> = {
  client: {
    card: "bg-success/15",
    active: "border-success bg-success/25",
    text: "text-success",
    particles: "#22c55e",
  },
  tasker: {
    card: "bg-primary/15",
    active: "border-primary bg-primary/25",
    text: "text-primary",
    particles: "#432dd7",
  },
};

const FIELDS: {
  name: "fullName" | "email" | "username" | "fullPhone";
  key: "fullName" | "email" | "username" | "phone";
  type?: string;
  autoComplete: string;
  className: string;
}[] = [
  {
    name: "fullName",
    key: "fullName",
    autoComplete: "name",
    className: "col-span-2",
  },
  {
    name: "email",
    key: "email",
    type: "email",
    autoComplete: "email",
    className: "col-span-1",
  },
  {
    name: "username",
    key: "username",
    autoComplete: "nickname",
    className: "col-span-1",
  },
  {
    name: "fullPhone",
    key: "phone",
    autoComplete: "tel",
    className: "col-span-2",
  },
];

export function Register() {
  const { t } = useTranslation(["register", "common", "errors"]);
  const { register, isLoading } = useUser();
  const [step, setStep] = useState<"role" | "form">("role");
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState<ZodErrors<RegisterForm>>({});
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    confirm: "",
    username: "",
    fullName: "",
    phone: "",
    code: "",
    role: "" as Role,
    fullPhone: "",
    agreementAccepted: false,
  });
  const toast = useToast();
  const strength = getPasswordStrength(form.password);

  const handleChange = useCallback(
    (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
    },
    [],
  );

  const clearPhoneErrors = useCallback(
    () =>
      setErrors((p) => ({
        ...p,
        phone: undefined,
        fullPhone: undefined,
      })),
    [],
  );

  const { handleLocalPhone, handleCodeChange } = usePhoneFields(
    setForm,
    clearPhoneErrors,
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (isLoading) return;
        const result = registerSchema.safeParse(form);
        if (!result.success) {
          const { fieldErrors, formErrors } = result.error.flatten();
          setErrors({
            fullName: fieldErrors.fullName?.[0],
            email: fieldErrors.email?.[0],
            username: fieldErrors.username?.[0],
            fullPhone: fieldErrors.fullPhone?.[0],
            password: fieldErrors.password?.[0],
            confirm: fieldErrors.confirm?.[0],
            agreementAccepted: fieldErrors.agreementAccepted?.[0],
            role: fieldErrors.role?.[0],
          });
          toast(formErrors[0]);
          return;
        }
        await register(form);
      } catch {}
    },
    [form, isLoading, register, toast],
  );

  if (step === "role") {
    return (
      <AuthLayout>
        <Title>{t("roleStep.title", { appName: t("common:appName") })}</Title>
        <p className="text-sm text-grey mb-6">{t("roleStep.subtitle")}</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ROLES.map(({ id, Icon }) => {
            const styles = ROLE_STYLES[id];
            const tags = t(`roles.${id}.tags`, {
              returnObjects: true,
            }) as string[];
            return (
              <button
                key={id}
                type="button"
                aria-pressed={form.role === id}
                onClick={() => setForm((p) => ({ ...p, role: id }))}
                className={clsx(
                  "flex flex-col items-start gap-3 p-5 rounded-xl border text-left relative",
                  "transition-all hover:-translate-y-0.5 active:scale-[0.98] group",
                  styles.card,
                  form.role === id
                    ? styles.active
                    : "border-border hover:border-ring",
                )}
              >
                <FlyingParticles
                  className="opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0 w-full h-full"
                  color={styles.particles}
                />
                <div
                  className={clsx(
                    "w-10 h-10 bg-background rounded-md border border-border text-2xl",
                    "transition-colors flex items-center justify-center",
                    styles.text,
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {t(`roles.${id}.title`)}
                  </p>
                  <p className="text-xs text-grey">{t(`roles.${id}.desc`)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded-full bg-background",
                        styles.text,
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <FieldError className="mb-4" message={errors.role} />
        <Button
          onClick={() => {
            if (!form.role) {
              setErrors((p) => ({ ...p, role: "role.required" }));
              return;
            }
            setStep("form");
            setErrors((p) => ({ ...p, role: undefined }));
          }}
        >
          {t("common:actions.continue")}
        </Button>
        <LoginLink />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <button
        type="button"
        onClick={() => setStep("role")}
        className="flex items-center gap-1.5 text-xs text-grey hover:text-primary mb-2 transition-colors"
      >
        <ArrowLeftToLine
          aria-hidden="true"
          className="w-4 h-4 text-[currentColor] transition-colors"
        />
        <span>{t("common:actions.back")}</span>
      </button>
      <Title>{t("formStep.title")}</Title>
      {form.role && (
        <p className="text-sm text-grey mb-6">{t(`roles.${form.role}.hint`)}</p>
      )}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-2 gap-y-5 gap-x-2"
      >
        {FIELDS.map(({ name, key, type = "text", autoComplete, className }) => {
          const error = errors[name] as string | undefined;
          return (
            <div key={name} className={clsx("form-group", className)}>
              <Label
                htmlFor={name === "fullPhone" ? "phone" : name}
                error={!!error}
              >
                {t(`fields.${key}.label`)}
              </Label>
              {name === "fullPhone" ? (
                <PhoneInput
                  error={error}
                  code={form.code}
                  setCode={handleCodeChange}
                  id="phone"
                  value={form.phone}
                  onChange={handleLocalPhone}
                />
              ) : (
                <Input
                  error={error}
                  type={type}
                  name={name}
                  autoComplete={autoComplete}
                  placeholder={t(`fields.${key}.placeholder`)}
                  value={form[name]}
                  onChange={handleChange(name)}
                />
              )}
              <FieldError message={error} />
            </div>
          );
        })}
        {(["password", "confirm"] as const).map((field) => {
          const error = errors[field] as string | undefined;
          return (
            <div key={field} className="form-group col-span-1">
              <Label htmlFor={field} error={!!error}>
                {t(`fields.${field}.label`)}
              </Label>
              <div className="relative">
                <Input
                  error={error}
                  name={field}
                  autoComplete="new-password"
                  type={show[field] ? "text" : "password"}
                  placeholder={t(`fields.${field}.placeholder`)}
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
        <div className="col-span-2">
          <PrivacyPolicyPublic
            error={!!errors.agreementAccepted}
            accepted={form.agreementAccepted}
            setAccepted={(accepted: boolean) => {
              setForm((p) => ({ ...p, agreementAccepted: accepted }));
              setErrors((p) => ({ ...p, agreementAccepted: undefined }));
            }}
          />
          <FieldError
            message={errors.agreementAccepted}
            className="col-span-2 -mt-3"
          />
        </div>
        <Button type="submit" disabled={isLoading} className="col-span-2">
          {isLoading ? t("formStep.submit.loading") : t("formStep.submit.idle")}
        </Button>
      </form>
      <LoginLink />
    </AuthLayout>
  );
}
