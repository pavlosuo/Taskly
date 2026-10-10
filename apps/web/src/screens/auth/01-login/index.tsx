"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useUser } from "@/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/shared/Input";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";
import { loginSchema, LoginForm, ZodErrors } from "shared/index";
import {
  PasswordToggle,
  RegisterLink,
  AuthLayout,
  Title,
} from "@/screens/auth/ui";
import { useToast } from "@/hooks/useToast";

export function Login() {
  const { t } = useTranslation("login");
  const { login, isLoading } = useUser();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ZodErrors<LoginForm>>({});
  const toast = useToast();

  const handleChange = useCallback(
    (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (isLoading) return;
        const result = loginSchema.safeParse(form);
        if (!result.success) {
          const { fieldErrors, formErrors } = result.error.flatten();
          setErrors({
            email: fieldErrors.email?.[0],
            password: fieldErrors.password?.[0],
          });
          toast(formErrors[0]);
          return;
        }
        await login({ email: form.email, password: form.password });
      } catch {}
    },
    [form, login, isLoading, toast],
  );

  return (
    <AuthLayout>
      <Title>{t("title")}</Title>
      <p className="text-sm text-grey mb-6">{t("subtitle")}</p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="form-group">
          <Label htmlFor="email" error={!!errors.email}>
            {t("email.label")}
          </Label>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("email.placeholder")}
            value={form.email}
            onChange={handleChange("email")}
            error={errors.email}
          />
          <FieldError message={errors.email} />
        </div>
        <div className="form-group">
          <Label htmlFor="password" error={!!errors.password}>
            {t("password.label")}
          </Label>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("password.placeholder")}
              value={form.password}
              onChange={handleChange("password")}
              error={errors.password}
              className="pr-10"
            />
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          <FieldError message={errors.password} />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/90 font-medium hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("submit.loading") : t("submit.idle")}
        </Button>
      </form>
      <RegisterLink />
    </AuthLayout>
  );
}
