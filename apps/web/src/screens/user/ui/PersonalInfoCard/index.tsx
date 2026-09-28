"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/shared/components/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PhoneInput } from "@/shared/components/PhoneInput";
import { User as UserIcon, SquarePen } from "lucide-react";
import clsx from "clsx";
import { OtpChannel } from "@shared/types";
import { useUser } from "@/providers/UserProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { SectionCard, Field, FormField, OtpInput } from "@/screens/user/ui";

export function PersonalInfoCard({
  onVerify,
}: {
  onVerify: (target: OtpChannel | null) => void;
}) {
  const {
    user,
    isLoading,
    updateProfile,
    sendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useUser();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "verify-email" | "verify-phone">(
    "form",
  );
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
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
  const [form, setForm] = useState(buildForm);
  const emailChanged = form.email !== user?.email;
  const phoneChanged = form.fullPhone !== user?.profile?.fullPhone;

  const handleChange =
    (field: keyof ReturnType<typeof buildForm>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const openDialog = () => {
    setForm(buildForm());
    setError("");
    setStep("form");
    setOpen(true);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setStep("form");
  };

  const handleSave = async () => {
    setError("");
    try {
      await updateProfile({
        fullName: form.fullName,
        username: form.username,
        email: emailChanged ? form.email : undefined,
        fullPhone: phoneChanged ? form.fullPhone : undefined,
        phone: phoneChanged ? form.phone : undefined,
        code: phoneChanged ? form.code : undefined,
      });
      if (emailChanged) {
        await sendEmailOtp();
        setStep("verify-email");
        return;
      }
      if (phoneChanged) {
        await sendPhoneOtp();
        setStep("verify-phone");
        return;
      }
      setOpen(false);
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  const handleConfirmEmail = async (code: string) => {
    setOtpError("");
    try {
      await verifyEmailOtp(code);
      setOpen(false);
      setStep("form");
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  const handleConfirmPhone = async (code: string) => {
    setOtpError("");
    try {
      await verifyPhoneOtp(code);
      setOpen(false);
      setStep("form");
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

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
        fullPhone: buildFullPhone(p.code ?? "", phone),
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

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<UserIcon className="w-6 h-6 text-background" />}
        title="Personal information"
        desc="Manage your basic account details and contact information."
      />
      <div className="border border-border bg-background p-4">
        <div className="flex justify-end mb-4 -mt-1">
          <button
            onClick={openDialog}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            <SquarePen className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
          <Field label="Full name" value={user.profile?.fullName || "—"} />
          <Field label="Username" value={user.username} />
          <Field
            label="Email"
            value={user.email}
            badge={user.acceptance?.emailVerified ? "Verified" : "Unverified"}
            badgeOk={user.acceptance?.emailVerified}
            onVerify={
              !user.acceptance?.emailVerified
                ? () => onVerify("email")
                : undefined
            }
          />
          <Field
            label="Phone number"
            value={user.profile?.fullPhone || "—"}
            badge={user.acceptance?.phoneVerified ? "Verified" : "Unverified"}
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
        <DialogContent className={clsx("sm:max-w-xl")}>
          <DialogHeader>
            <DialogTitle>
              {step === "form" && "Edit personal information"}
              {step === "verify-email" && "Verify your new email"}
              {step === "verify-phone" && "Verify your new phone number"}
            </DialogTitle>
            <DialogDescription>
              {step === "form" &&
                "Update your personal details and contact information."}
              {step === "verify-email" &&
                `We sent a code to ${form.email}. Enter it below to confirm the change.`}
              {step === "verify-phone" &&
                `We sent a code to ${form.fullPhone}. Enter it below to confirm the change.`}
            </DialogDescription>
          </DialogHeader>
          {step === "form" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <FormField label="Full name">
                  <Input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                  />
                </FormField>
                <FormField label="Username">
                  <Input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange("username")}
                  />
                </FormField>
                <FormField
                  label="Email"
                  hint={
                    emailChanged
                      ? "Changing email will require verification."
                      : undefined
                  }
                >
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </FormField>
                <FormField
                  label="Phone number"
                  hint={
                    phoneChanged
                      ? "Changing phone will require verification."
                      : undefined
                  }
                >
                  <PhoneInput
                    code={form.code}
                    setCode={handleCodeChange}
                    value={form.phone}
                    onChange={handleLocalPhone}
                    id="phone"
                  />
                </FormField>
              </div>
              {error && <p className="text-xs text-red">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          )}
          {step === "verify-email" && (
            <OtpInput
              onConfirm={handleConfirmEmail}
              onResend={() => sendEmailOtp()}
              isLoading={isLoading}
              error={otpError}
            />
          )}
          {step === "verify-phone" && (
            <OtpInput
              onConfirm={handleConfirmPhone}
              onResend={sendPhoneOtp}
              isLoading={isLoading}
              error={otpError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
