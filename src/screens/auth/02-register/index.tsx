"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "providers/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "root/include/schemas";
import { RegisterForm, Role } from "root/include/types";
import {
  AuthLayout,
  FieldError,
  PasswordToggle,
  BottomLink,
  Title,
} from "../ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { getPasswordStrength } from "@/utils/getPasswordStrength";
import clsx from "clsx";
import { PhoneInput } from "@/shared/components/PhoneInput";
import { CalendarCheck, UserPlus, ArrowLeftToLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FlyingParticles } from "@/shared/components/FlyingParticles";

type RegisterErrors = {
  fullName?: string;
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  confirm?: string;
  general?: string;
  role?: string;
  code?: string;
  fullPhone?: string;
};

export function Register() {
  const { t } = useTranslation("register");
  const { register, isLoading } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form">("role");
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState<RegisterErrors>({});
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

  const handleLocalPhone = useCallback(
    (phone: string) => {
      setErrors((p) => ({ ...p, phone: undefined, general: undefined }));
      setForm((p) => ({
        ...p,
        phone,
        fullPhone: form.code + phone.replace(/\s/g, ""),
      }));
    },
    [form.code],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fmt = result.error.format() as Record<
        string,
        { _errors: string[] }
      > & { _errors: string[] };
      setErrors({
        fullName: fmt.fullName?._errors[0],
        email: fmt.email?._errors[0],
        username: fmt.username?._errors[0],
        fullPhone: fmt.fullPhone?._errors[0],
        password: fmt.password?._errors[0],
        confirm: fmt.confirm?._errors[0],
        general: fmt._errors[0],
      });
      return;
    }
    try {
      await register({ ...form, role: form.role! });
      router.push("/dashboard");
    } catch (err) {
      setErrors({ general: getAxiosError(err) });
    }
  };

  if (step === "role") {
    return (
      <AuthLayout>
        <Title>{t("roleStep.title")}</Title>
        <p className="text-sm text-grey mb-8 leading-relaxed">
          {t("roleStep.subtitle")}
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: r.id }))}
              className={clsx(
                "flex flex-col items-start gap-3 p-5 rounded-xl border-[1.5px] text-left relative",
                "transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] group",
                r.id === "client" ? "bg-primary/5" : "bg-accent/5",
                form.role === r.id
                  ? r.id === "client"
                    ? "border-primary bg-primary/25"
                    : "border-accent bg-accent/25"
                  : "border-border hover:border-ring",
              )}
            >
              <FlyingParticles
                className="opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0 w-full h-full"
                color={r.id === "client" ? "#1447e6" : "#00813a"}
              />
              <div
                className={clsx(
                  "w-10 h-10 bg-background rounded-md border border-border flex items-center justify-content-center text-2xl",
                  "transition-colors duration-150 flex items-center justify-center",
                  r.id === "client" ? "text-primary" : "text-accent",
                )}
              >
                <r.Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-grey leading-relaxed">{r.desc}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.tags.map((tag) => (
                  <span
                    key={tag}
                    className={clsx(
                      "text-[11px] px-2 py-0.5 rounded-full bg-background",
                      r.id === "client" ? "text-primary" : "text-accent",
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
      <p className="text-sm text-grey mb-6 leading-relaxed">
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
                <Label
                  htmlFor={name}
                  className={clsx(
                    "text-sm font-medium mb-1.5 block",
                    error ? "text-red" : "text-foreground",
                  )}
                >
                  {label}
                </Label>
                {name === "fullPhone" ? (
                  <PhoneInput
                    error={error}
                    code={form.code}
                    setCode={(code) => setForm((p) => ({ ...p, code }))}
                    id="phone"
                    value={form.phone}
                    onChange={handleLocalPhone}
                  />
                ) : (
                  <Input
                    id={name}
                    type={type}
                    name={name}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange(name)}
                    className={clsx(
                      "h-10 rounded-lg text-sm placeholder:text-grey",
                      error
                        ? "border-red focus-visible:ring-red-75"
                        : "border-border",
                    )}
                  />
                )}
                <FieldError message={error} />
              </div>
            );
          },
        )}
        {(["password", "confirm"] as const).map((field) => {
          const error = errors[field];
          return (
            <div key={field} className="form-group col-span-1">
              <Label
                htmlFor={field}
                className={clsx(
                  "text-sm font-medium mb-1.5 block",
                  error ? "text-red" : "text-foreground",
                )}
              >
                {t(`fields.${field}.label`)}
              </Label>
              <div className="relative">
                <Input
                  id={field}
                  name={field}
                  autoComplete="off"
                  type={show[field] ? "text" : "password"}
                  placeholder={t(`fields.${field}.placeholder`)}
                  value={form[field]}
                  onChange={handleChange(field)}
                  className={clsx(
                    "h-10 rounded-lg text-sm placeholder:text-grey pr-10",
                    error
                      ? "border-red focus-visible:ring-red-75"
                      : "border-border",
                  )}
                />
                <PasswordToggle
                  show={show[field]}
                  onToggle={() =>
                    setShow((p) => ({ ...p, [field]: !p[field] }))
                  }
                />
              </div>
              {field === "password" && strength && (
                <p className={clsx("text-xs mt-1 font-medium", strength.color)}>
                  {strength.tips[0] ?? strength.label}
                </p>
              )}
              <FieldError message={error} />
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
