"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/shared/components/Input";
import { registerSchema, RegisterForm, Role, ZodErrors } from "@shared/index";
import {
  AuthLayout,
  FieldError,
  PasswordToggle,
  BottomLink,
  Title,
  Label,
} from "@/screens/auth/ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { getPasswordStrength } from "@shared/utils";
import clsx from "clsx";
import { PhoneInput } from "@/shared/components/PhoneInput";
import { CalendarCheck, UserPlus, ArrowLeftToLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FlyingParticles } from "@/shared/components/FlyingParticles";

export function Register() {
  const { t } = useTranslation("register");
  const { t: tErrors } = useTranslation("errors");
  const { register, isLoading } = useUser();
  const router = useRouter();
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
    role: "",
    fullPhone: "",
  });
  const strength = getPasswordStrength(form.password);
  const roles = [
    {
      id: "client" as Role,
      title: t("roles.client.title"),
      desc: t("roles.client.desc"),
      Icon: UserPlus,
      tags: [t("roles.client.tags.0"), t("roles.client.tags.1")],
      hint: t("roles.client.hint"),
    },
    {
      id: "tasker" as Role,
      title: t("roles.tasker.title"),
      desc: t("roles.tasker.desc"),
      Icon: CalendarCheck,
      tags: [t("roles.tasker.tags.0"), t("roles.tasker.tags.1")],
      hint: t("roles.tasker.hint"),
    },
  ];
  const fields: {
    name: keyof RegisterForm;
    label: string;
    type?: string;
    autoComplete?: string;
    placeholder: string;
  }[] = [
    {
      name: "fullName",
      label: t("fields.fullName.label"),
      placeholder: t("fields.fullName.placeholder"),
      autoComplete: "name",
    },
    {
      name: "email",
      label: t("fields.email.label"),
      placeholder: t("fields.email.placeholder"),
      type: "email",
      autoComplete: "email",
    },
    {
      name: "username",
      label: t("fields.username.label"),
      placeholder: t("fields.username.placeholder"),
      autoComplete: "username",
    },
    {
      name: "fullPhone",
      label: t("fields.phone.label"),
      placeholder: t("fields.phone.placeholder"),
      autoComplete: "tel",
    },
  ];

  const handleChange = useCallback(
    (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
    },
    [],
  );

  const buildFullPhone = useCallback(
    (code: string, phone: string) =>
      `${code ?? ""}${(phone ?? "").replace(/\s/g, "")}`,
    [],
  );

  const handleLocalPhone = useCallback(
    (phone: string) => {
      setErrors((p) => ({
        ...p,
        phone: undefined,
        fullPhone: undefined,
        general: undefined,
      }));
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
      setErrors((p) => ({ ...p, fullPhone: undefined, general: undefined }));
      setForm((p) => ({
        ...p,
        code,
        fullPhone: buildFullPhone(code, p.phone),
      }));
    },
    [buildFullPhone],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        general: formErrors[0],
      });
      return;
    }

    try {
      await register({ ...form, role: form.role! });
      router.push("/profile");
    } catch (err) {
      setErrors({ general: getAxiosError(err) });
    }
  };

  if (step === "role") {
    return (
      <AuthLayout>
        <Title>{t("roleStep.title")}</Title>
        <p className="text-sm text-grey mb-8">{t("roleStep.subtitle")}</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: r.id }))}
              className={clsx(
                "flex flex-col items-start gap-3 p-5 rounded-xl border-0.5 text-left relative",
                "transition-all hover:-translate-y-0.5 active:scale-[0.98] group",
                r.id === "client" ? "bg-success/15" : "bg-primary/15",
                form.role === r.id
                  ? r.id === "client"
                    ? "border-success bg-success/25"
                    : "border-primary bg-primary/25"
                  : "border-border hover:border-ring",
              )}
            >
              <FlyingParticles
                className="opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0 w-full h-full"
                color={r.id === "client" ? "#22c55e" : "#432dd7"}
              />
              <div
                className={clsx(
                  "w-10 h-10 bg-background rounded-md border border-border flex items-center justify-content-center text-2xl",
                  "transition-colors flex items-center justify-center",
                  r.id === "client" ? "text-success" : "text-primary",
                )}
              >
                <r.Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-grey">{r.desc}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.tags.map((tag) => (
                  <span
                    key={tag}
                    className={clsx(
                      "text-[11px] px-2 py-0.5 rounded-full bg-background",
                      r.id === "client" ? "text-success" : "text-primary",
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        <Button onClick={() => setStep("form")} disabled={!form.role}>
          {t("roleStep.continue")}
        </Button>
        <BottomLink
          text={t("bottomLink.text")}
          label={t("bottomLink.label")}
          onClick={() => router.push("/login")}
        />
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
        <ArrowLeftToLine className="w-4 h-4 text-[currentColor] transition-colors" />
        <span>{t("formStep.back")}</span>
      </button>
      <Title>{t("formStep.title")}</Title>
      <p className="text-sm text-grey mb-6">
        {form.role === "client"
          ? t("roles.client.hint")
          : t("roles.tasker.hint")}
      </p>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-2 gap-y-5 gap-x-2"
      >
        {fields.map(
          ({ name, label, type = "text", autoComplete, placeholder }) => {
            const error = errors[name] as string | undefined;
            return (
              <div
                key={name}
                className={clsx(
                  "form-group",
                  name === "email" || name === "username"
                    ? "col-span-1"
                    : "col-span-2",
                )}
              >
                <Label htmlFor={name} error={!!error}>
                  {label}
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
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange(name)}
                  />
                )}
                <FieldError message={error ? tErrors(error) : ""} />
              </div>
            );
          },
        )}
        {(["password", "confirm"] as const).map((field, i) => {
          const error = errors[field] as string;
          const confirmError = errors.confirm as string;
          return (
            <div key={field} className="form-group col-span-1">
              <Label htmlFor={field} error={!!error}>
                {t(`fields.${field}.label`)}
              </Label>
              <div className="relative">
                <Input
                  error={error}
                  name={field}
                  autoComplete="off"
                  type={show[field] ? "text" : "password"}
                  placeholder={t(`fields.${field}.placeholder`)}
                  value={form[field]}
                  onChange={handleChange(field)}
                  className={clsx("pr-10")}
                />
                <PasswordToggle
                  show={show[field]}
                  onToggle={() =>
                    setShow((p) => ({ ...p, [field]: !p[field] }))
                  }
                />
              </div>
              {field === "password" && strength && !confirmError && (
                <p className={clsx("text-xs mt-1 font-medium", strength.color)}>
                  {tErrors(strength.tips[0] ?? strength.label)}
                </p>
              )}
              {confirmError && i === 0 && (
                <FieldError
                  message={confirmError ? tErrors(confirmError) : ""}
                />
              )}
              {!confirmError && (
                <FieldError message={error ? tErrors(error) : ""} />
              )}
            </div>
          );
        })}
        {errors.general && (
          <p className="text-xs text-red -mt-2">{errors.general}</p>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className={clsx("col-span-2")}
        >
          {isLoading ? t("formStep.submit.loading") : t("formStep.submit.idle")}
        </Button>
      </form>
      <BottomLink
        text={t("bottomLink.text")}
        label={t("bottomLink.label")}
        onClick={() => router.push("/login")}
      />
    </AuthLayout>
  );
}
