"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/shared/Input";
import { loginSchema, LoginForm, ZodErrors } from "shared/index";
import {
  PasswordToggle,
  BottomLink,
  AuthLayout,
  Title,
} from "@/screens/auth/ui";
import { getAxiosError } from "@/utils/getAxiosError";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { FieldError } from "@/components/shared/FieldError";
import { Label } from "@/components/shared/Label";

export function Login() {
  const { t } = useTranslation("login");
  const { t: tErrors } = useTranslation("errors");
  const { login, isLoading } = useUser();
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ZodErrors<LoginForm>>({});

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
      const result = loginSchema.safeParse(form);
      if (!result.success) {
        const { fieldErrors, formErrors } = result.error.flatten();
        setErrors({
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
          general: formErrors[0],
        });
        return;
      }
      try {
        await login({ email: form.email, password: form.password });
        router.push("/");
      } catch (e) {
        setErrors({ general: getAxiosError(e) });
      }
    },
    [form, login, router],
  );

  return (
    <AuthLayout>
      <Title>{t("title")}</Title>
      <p className="text-sm text-grey mb-8">{t("subtitle")}</p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="form-group">
          <Label htmlFor="email" error={!!errors.email}>
            {t("email.label")}
          </Label>
          <Input
            error={errors.email}
            name="email"
            autoComplete="email"
            type="text"
            placeholder={t("email.placeholder")}
            value={form.email}
            onChange={handleChange("email")}
          />
          <FieldError message={errors.email ? tErrors(errors.email) : ""} />
        </div>
        <div className="form-group">
          <Label htmlFor="password" error={!!errors.password}>
            {t("password.label")}
          </Label>
          <div className="relative">
            <Input
              error={errors.email}
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("password.placeholder")}
              value={form.password}
              onChange={handleChange("password")}
              className={clsx("pr-10")}
            />
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          <FieldError
            message={errors.password ? tErrors(errors.password) : ""}
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-primary hover:text-primary/90 font-medium hover:underline"
            >
              {t("forgotPassword")}
            </button>
          </div>
        </div>
        {errors.general && (
          <p className="text-xs text-destructive -mt-2">{errors.general}</p>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("submit.loading") : t("submit.idle")}
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-grey" />
          <span className="text-xs text-foreground">{t("divider")}</span>
          <div className="flex-1 h-px bg-grey" />
        </div>
      </form>
      <BottomLink
        text={t("bottomLink.text")}
        label={t("bottomLink.label")}
        onClick={() => router.push("/register")}
      />
    </AuthLayout>
  );
}
