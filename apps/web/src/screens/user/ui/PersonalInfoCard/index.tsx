"use client";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input, PhoneInput } from "@/components/shared/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { User as UserIcon, SquarePen } from "lucide-react";
import clsx from "clsx";
import {
  OtpChannel,
  updateProfileSchema,
  UpdateProfileForm,
  ZodErrors,
} from "shared/index";
import { useUser } from "@/providers/UserProvider";
import { SectionCard, Field, FormField, OtpInput } from "@/screens/user/ui";
import { useToast } from "@/hooks/useToast";

export function PersonalInfoCard({
  onVerify,
}: {
  onVerify: (target: OtpChannel | null) => void;
}) {
  const { t } = useTranslation("profile");
  const toast = useToast();
  const {
    user,
    isLoading,
    updateProfile,
    sendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useUser();
  const buildForm = useCallback(
    () => ({
      fullName: user?.profile?.fullName ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      fullPhone: user?.profile?.fullPhone ?? "",
      phone: user?.profile?.phone ?? "",
      code: user?.profile?.code,
    }),
    [user],
  );
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "verify-email" | "verify-phone">(
    "form",
  );
  const [errors, setErrors] = useState<ZodErrors<UpdateProfileForm>>({});
  const [form, setForm] = useState(buildForm);
  const emailChanged = form.email !== user?.email;
  const phoneChanged = form.fullPhone !== user?.profile?.fullPhone;

  const handleChange = (field: keyof UpdateProfileForm, value?: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const openDialog = () => {
    setForm(buildForm());
    setErrors({});
    setStep("form");
    setOpen(true);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setStep("form");
  };

  const handleSave = async () => {
    setErrors({});
    try {
      const parsed = updateProfileSchema.safeParse(form);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        setErrors({
          fullName: fieldErrors.fullName?.[0],
          username: fieldErrors.username?.[0],
          email: fieldErrors.email?.[0],
          fullPhone: fieldErrors.fullPhone?.[0],
          phone: fieldErrors.phone?.[0],
          code: fieldErrors.code?.[0],
        });
        toast(formErrors[0]);
        return;
      }
      await updateProfile({
        fullName: form.fullName,
        username: form.username,
        email: emailChanged ? form.email : undefined,
        fullPhone: phoneChanged ? form.fullPhone : undefined,
        phone: phoneChanged ? form.phone : undefined,
        code: phoneChanged ? form.code : undefined,
      });
      if (emailChanged) {
        setStep("verify-email");
        await sendEmailOtp();
        return;
      }
      if (phoneChanged) {
        setStep("verify-phone");
        await sendPhoneOtp();
        return;
      }
      setOpen(false);
    } catch {}
  };

  const handleConfirmEmail = async (code: string) => {
    try {
      await verifyEmailOtp(code);
      setOpen(false);
      setStep("form");
    } catch {}
  };

  const handleConfirmPhone = async (code: string) => {
    try {
      await verifyPhoneOtp(code);
      setOpen(false);
      setStep("form");
    } catch {}
  };

  const buildFullPhone = useCallback(
    (code: string, phone: string) =>
      `${code ?? ""}${(phone ?? "").replace(/\s/g, "")}`,
    [],
  );

  const handleLocalPhone = useCallback(
    (phone: string) => {
      setForm((p) => ({
        ...p,
        phone,
        fullPhone: buildFullPhone(p.code ?? "", phone),
      }));
    },
    [buildFullPhone],
  );

  const handleCodeChange = useCallback(
    (code: string) => {
      setForm((p) => ({
        ...p,
        code,
        fullPhone: buildFullPhone(code, p.phone),
      }));
    },
    [buildFullPhone],
  );

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={
          <UserIcon aria-hidden="true" className="w-6 h-6 text-background" />
        }
        title={t("personal.title")}
        desc={t("personal.desc")}
      />
      <div className="border border-border bg-background p-4">
        <div className="flex justify-end mb-4 -mt-1">
          <button
            onClick={openDialog}
            aria-label={t("personal.editAria")}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            <SquarePen aria-hidden="true" className="w-4 h-4" />
            <span>{t("actions.edit")}</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
          <Field
            label={t("personal.fullName")}
            value={user.profile?.fullName}
          />
          <Field label={t("personal.username")} value={user.username} />
          <Field
            label={t("personal.email")}
            value={user.email}
            badge={
              user.acceptance?.emailVerified
                ? t("personal.verified")
                : t("personal.unverified")
            }
            badgeOk={user.acceptance?.emailVerified}
            onVerify={
              !user.acceptance?.emailVerified
                ? () => onVerify("email")
                : undefined
            }
          />
          <Field
            label={t("personal.phone")}
            value={user.profile?.fullPhone}
            badge={
              user.acceptance?.phoneVerified
                ? t("personal.verified")
                : t("personal.unverified")
            }
            badgeOk={user.acceptance?.phoneVerified}
            onVerify={
              !user.acceptance?.phoneVerified
                ? () => onVerify("phone")
                : undefined
            }
          />
        </div>
      </div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={clsx(step === "form" && "sm:max-w-xl")}>
          <DialogHeader>
            <DialogTitle>
              {step === "form" && t("personal.dialog.formTitle")}
              {step === "verify-email" && t("personal.dialog.emailTitle")}
              {step === "verify-phone" && t("personal.dialog.phoneTitle")}
            </DialogTitle>
            <DialogDescription>
              {step === "form" && t("personal.dialog.formDesc")}
              {step === "verify-email" &&
                t("personal.dialog.emailDesc", {
                  email: form.email,
                  interpolation: { escapeValue: false },
                })}
              {step === "verify-phone" &&
                t("personal.dialog.phoneDesc", {
                  phone: form.fullPhone,
                  interpolation: { escapeValue: false },
                })}
            </DialogDescription>
          </DialogHeader>
          {step === "form" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <FormField
                  label={t("personal.fullName")}
                  error={errors.fullName}
                  htmlFor="fullName"
                >
                  <Input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    error={errors.fullName}
                  />
                </FormField>
                <FormField
                  label={t("personal.username")}
                  error={errors.username}
                  htmlFor="username"
                >
                  <Input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    error={errors.username}
                  />
                </FormField>
                <FormField
                  label={t("personal.email")}
                  htmlFor="email"
                  hint={emailChanged ? t("personal.emailHint") : undefined}
                  error={errors.email}
                >
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    error={errors.email}
                  />
                </FormField>
                <FormField
                  label={t("personal.phone")}
                  htmlFor="phone"
                  hint={phoneChanged ? t("personal.phoneHint") : undefined}
                  error={errors.fullPhone}
                >
                  <PhoneInput
                    code={form.code}
                    setCode={handleCodeChange}
                    value={form.phone}
                    onChange={handleLocalPhone}
                    id="phone"
                    error={errors.fullPhone}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("actions.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? t("actions.saving") : t("actions.save")}
                </Button>
              </DialogFooter>
            </>
          )}
          {step === "verify-email" && (
            <OtpInput
              onConfirm={handleConfirmEmail}
              onResend={async () => {
                await sendEmailOtp();
                setErrors({});
              }}
              isLoading={isLoading}
            />
          )}
          {step === "verify-phone" && (
            <OtpInput
              onConfirm={handleConfirmPhone}
              onResend={async () => {
                await sendPhoneOtp();
                setErrors({});
              }}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
