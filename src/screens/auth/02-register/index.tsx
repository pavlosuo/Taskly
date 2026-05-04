"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "providers/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { taskerRegisterSchema } from "../../../../include/schemas";
import { RegisterForm } from "@/types";
import { AuthLayout, FieldError, PasswordToggle, BottomLink } from "../ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { getPasswordStrength } from "@/utils/getPasswordStrength";
import { ClickwrapPublic } from "shared/components/Clickwrap";
import clsx from "clsx";
import { PhoneInput } from "@/shared/components/PhoneInput";

type RegisterErrors = {
  fullName?: string;
  email?: string;
  username?: string;
  phone?: string;
  HETU?: string;
  password?: string;
  confirm?: string;
  agreementAccepted?: string;
  general?: string;
};

export function Register() {
  const { register, isLoading } = useUser();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    confirm: "",
    username: "",
    fullName: "",
    phone: "",
    HETU: "",
    agreementAccepted: false,
  });
  const strength = getPasswordStrength(form.password);

  const handleChange = useCallback(
    (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = taskerRegisterSchema.safeParse(form);
    if (!result.success) {
      const fmt = result.error.format() as {
        _errors: string[];
        fullName?: { _errors: string[] };
        email?: { _errors: string[] };
        username?: { _errors: string[] };
        phone?: { _errors: string[] };
        HETU?: { _errors: string[] };
        password?: { _errors: string[] };
        confirm?: { _errors: string[] };
        agreementAccepted?: { _errors: string[] };
      };
      setErrors({
        fullName: fmt.fullName?._errors[0],
        email: fmt.email?._errors[0],
        username: fmt.username?._errors[0],
        phone: fmt.phone?._errors[0],
        HETU: fmt.HETU?._errors[0],
        password: fmt.password?._errors[0],
        confirm: fmt.confirm?._errors[0],
        agreementAccepted: fmt.agreementAccepted?._errors[0],
        general: fmt._errors[0],
      });
      return;
    }

    try {
      const fd = new FormData();
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("confirm", form.confirm);
      fd.append("username", form.username);
      fd.append("fullName", form.fullName);
      fd.append("phone", form.phone);
      fd.append("HETU", form.HETU);
      fd.append("agreementFile", agreementFile as File);
      fd.append("agreementAccepted", form.agreementAccepted ? "true" : "false");
      await register(fd);
      router.push("/");
    } catch (err) {
      setErrors({ general: getAxiosError(err) });
    }
  };

  const onConfirm = (blob: Blob) => {
    setAgreementFile(
      new File([blob], "agreement.pdf", {
        type: blob.type || "application/pdf",
      }),
    );
    setForm((p) => ({ ...p, agreementAccepted: true }));
    setErrors((p) => ({ ...p, agreementAccepted: undefined }));
  };

  useEffect(() => {
    if (!localPhone) return;
    requestAnimationFrame(() => {
      setForm((p) => ({ ...p, phone: code + localPhone }));
    });
  }, [localPhone, code]);

  const fields: {
    name: keyof RegisterForm;
    label: string;
    type?: string;
    autoComplete?: string;
  }[] = [
    { name: "fullName", label: "Full name", autoComplete: "name" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "username", label: "Username", autoComplete: "username" },
    { name: "phone", label: "Phone", autoComplete: "tel" },
    { name: "HETU", label: "HETU", autoComplete: "off" },
  ];

  return (
    <AuthLayout>
      <h1 className="text-[28px] font-bold text-gray-900 mb-1 tracking-tight">
        Create Account
      </h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        Sign up to get started with your new account.
      </p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {fields.map(({ name, label, type = "text", autoComplete }) => {
          const error = errors[name] as string | undefined;
          return (
            <div key={name} className="form-group">
              <Label
                htmlFor={name}
                className={clsx(
                  "text-sm font-medium mb-1.5 block",
                  error ? "text-red" : "text-gray-700",
                )}
              >
                {label}
              </Label>
              {name === "phone" && (
                <PhoneInput
                  error={error}
                  code={code}
                  setCode={setCode}
                  id={name}
                  value={localPhone}
                  onChange={setLocalPhone}
                />
              )}
              {name !== "phone" && (
                <Input
                  id={name}
                  type={type}
                  name={name}
                  autoComplete={autoComplete}
                  placeholder={`Enter your ${label.toLowerCase()}`}
                  value={form[name] as string}
                  onChange={handleChange(name)}
                  className={clsx(
                    "h-10 rounded-lg text-sm placeholder:text-gray-400",
                    error
                      ? "border-red-400 focus-visible:ring-red-200"
                      : "border-gray-200",
                  )}
                />
              )}
              <FieldError message={error} />
            </div>
          );
        })}
        {(["password", "confirm"] as const).map((field) => {
          const error = errors[field];
          return (
            <div key={field} className="form-group">
              <Label
                htmlFor={field}
                className={clsx(
                  "text-sm font-medium mb-1.5 block",
                  error ? "text-red" : "text-gray-700",
                )}
              >
                {field === "password" ? "Password" : "Confirm password"}
              </Label>
              <div className="relative">
                <Input
                  id={field}
                  name={field}
                  autoComplete={"off"}
                  type={show[field] ? "text" : "password"}
                  placeholder={
                    field === "password"
                      ? "Create a password"
                      : "Repeat your password"
                  }
                  value={form[field]}
                  onChange={handleChange(field)}
                  className={clsx(
                    "h-10 rounded-lg text-sm placeholder:text-gray-400 pr-10",
                    error
                      ? "border-red-400 focus-visible:ring-red-200"
                      : "border-gray-200",
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
        <ClickwrapPublic
          error={!!errors.agreementAccepted}
          onConfirm={onConfirm}
        />
        {errors.agreementAccepted && (
          <p className="text-xs text-red">{errors.agreementAccepted}</p>
        )}
        {errors.general && (
          <p className="text-xs text-red -mt-2">{errors.general}</p>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-[#5a6478] hover:bg-[#4a5468] text-white text-sm font-medium"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <BottomLink
        text="Already have an account?"
        label="Sign in"
        onClick={() => router.push("/login")}
      />
    </AuthLayout>
  );
}
