"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "providers/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "../../../../include/schemas";
import { LoginForm, ZodErrors } from "@/types";
import {
  FieldError,
  GoogleIcon,
  PasswordToggle,
  BottomLink,
  AuthLayout,
} from "../ui";
import { getAxiosError } from "@/utils/getAxiosError";

export function Login() {
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
      } catch (err) {
        setErrors({ general: getAxiosError(err) });
      }
    },
    [form, login, router],
  );

  return (
    <AuthLayout>
      <h1 className="text-[28px] font-bold text-gray-900 mb-1 tracking-tight">
        Welcome Back
      </h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        Sign in to access your account and manage your dashboard.
      </p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="form-group">
          <Label
            htmlFor="email"
            className={`text-sm font-medium mb-1.5 block ${errors.email ? "text-red" : "text-gray-700"}`}
          >
            Email
          </Label>
          <Input
            name="email"
            id="email"
            autoComplete="email"
            type="text"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange("email")}
            className={`h-10 rounded-lg text-sm placeholder:text-gray-400 ${errors.email ? "border-red-400 focus-visible:ring-red-200" : "border-gray-200"}`}
          />
          <FieldError message={errors.email} />
        </div>
        <div className="form-group">
          <Label
            htmlFor="password"
            className={`text-sm font-medium mb-1.5 block ${errors.password ? "text-red" : "text-gray-700"}`}
          >
            Password
          </Label>
          <div className="relative">
            <Input
              name="password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange("password")}
              className={`h-10 rounded-lg text-sm placeholder:text-gray-400 pr-10 ${errors.password ? "border-red-400 focus-visible:ring-red-200" : "border-gray-200"}`}
            />
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          <FieldError message={errors.password} />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>
        {errors.general && (
          <p className="text-xs text-red -mt-2">{errors.general}</p>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-[#5a6478] hover:bg-[#4a5468] text-white text-sm font-medium"
        >
          {isLoading ? "Signing in..." : "Log in"}
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-lg border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </form>
      <BottomLink
        text="Don't have an account yet?"
        label="Create now"
        onClick={() => router.push("/register")}
      />
    </AuthLayout>
  );
}
