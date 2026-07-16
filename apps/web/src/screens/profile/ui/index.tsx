"use client";
import { useState, useCallback } from "react";
import { User as UserIcon, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PhoneInput } from "@/shared/components/PhoneInput";
import {
  Landmark,
  Plus,
  Shield,
  FileLock,
  ArrowRight,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { finnishBanks } from "@shared/data";
import { Label } from "@/components/ui/label";
import clsx from "clsx";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { OtpChannel } from "@shared/types";
import { useModal } from "@/providers/Modal";
import { useUser } from "@/providers/User";
import { IbanInput, formatIban } from "@/shared/components/IbanInput";
import { getAxiosError } from "@/utils/getAxiosError";

type PersonalStep = "form" | "verify-email" | "verify-phone";

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
  const [step, setStep] = useState<PersonalStep>("form");
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

  const handleLocalPhone = (phone: string) =>
    setForm((p) => ({
      ...p,
      phone,
      fullPhone: p.code + phone.replace(/\s/g, ""),
    }));

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

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<UserIcon className="w-6 h-6 text-background" />}
        title="Personal information"
        desc="Manage your basic account details and contact information."
      />
      <div className="rounded-xl border border-border bg-background p-4">
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
        <DialogContent className="sm:max-w-xl border-border">
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
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    className="h-10 rounded-lg text-sm placeholder:text-grey"
                  />
                </FormField>
                <FormField label="Username">
                  <Input
                    value={form.username}
                    onChange={handleChange("username")}
                    className="h-10 rounded-lg text-sm placeholder:text-grey"
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
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    className="h-10 rounded-lg text-sm placeholder:text-grey"
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
                    setCode={(code: string) => setForm((p) => ({ ...p, code }))}
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

export function PayoutCard() {
  const { user, isLoading, updateProfile } = useUser();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    iban: user?.payout?.iban ?? "",
    bankName: user?.payout?.bankName ?? "",
  });

  const openDialog = () => {
    setForm({
      iban: user?.payout?.iban ?? "",
      bankName: user?.payout?.bankName ?? "",
    });
    setError("");
    setOpen(true);
  };

  const handleSave = async () => {
    setError("");
    try {
      await updateProfile({ payout: form });
      setOpen(false);
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  if (!user) return null;

  const bankLabel = finnishBanks.find(
    (b) => b.value === user.payout?.bankName,
  )?.label;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Landmark className="w-6 h-6 text-background" />}
        title="Payout details"
        desc="Where we send your earnings for completed tasks."
      />
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex justify-end mb-4 -mt-1">
          <button
            onClick={openDialog}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            {user.payout?.iban ? (
              <>
                <SquarePen className="w-4 h-4" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
        {user.payout?.iban ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            <Field label="IBAN" value={formatIban(user.payout.iban)} />
            {bankLabel && <Field label="Bank" value={bankLabel} />}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3">
            <p className="text-xs text-grey">
              No payout method added yet — add one to get paid out.
            </p>
            <button
              onClick={openDialog}
              className="text-xs font-medium text-primary hover:underline underline-offset-2 shrink-0 ml-3"
            >
              Add now
            </button>
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl border-border">
          <DialogHeader>
            <DialogTitle>Edit payout details</DialogTitle>
            <DialogDescription>
              We&apos;ll transfer your earnings to this account after each
              completed task.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <FormField label="Bank">
              <Select
                value={form.bankName}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, bankName: value }))
                }
              >
                <SelectTrigger className="h-10 rounded-lg text-sm w-full">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="w-full bg-background">
                  {finnishBanks.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      <Image
                        className="w-5 h-5"
                        src={bank.src}
                        alt={bank.label}
                        width={20}
                        height={20}
                      />
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="IBAN">
              <IbanInput
                value={form.iban}
                onChange={(value) => setForm((p) => ({ ...p, iban: value }))}
                className="h-10 rounded-lg text-sm font-mono"
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SecurityCard() {
  const { deactivateAccount, changePassword, isLoading } = useUser();
  const { confirm } = useModal();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handlePasswordClick = () => {
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setError("");
    setOpen(true);
  };

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleDeactivateClick = () => {
    confirm(
      "Are you sure you want to deactivate your account? This cannot be undone.",
    ).then((confirmed) => {
      if (confirmed) deactivateAccount();
    });
  };

  const handleSavePassword = async () => {
    setError("");

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      setOpen(false);
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Shield className="w-6 h-6 text-background" />}
        title="Security"
        desc="Update your password and control account access."
      />
      <div className="flex flex-col gap-2">
        <button
          onClick={handlePasswordClick}
          className="w-full grid gap-3 grid-cols-[auto_1fr_auto] items-center py-3 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-foreground/5 transition-colors"
        >
          <FileLock className="w-4 h-4 text-grey" />
          <span className="text-left">Change password</span>
          <ArrowRight className="w-4 h-4 text-grey" />
        </button>
        <button
          onClick={handleDeactivateClick}
          className="w-full grid gap-3 grid-cols-[auto_1fr_auto] items-center py-3 px-4 rounded-lg border border-border text-sm text-red hover:bg-red/5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-left">Deactivate account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl border-border">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Your new password must be at least 8 characters long.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <FormField label="Current password">
              <Input
                type="password"
                autoComplete="current-password"
                value={form.oldPassword}
                onChange={handleChange("oldPassword")}
                className="h-10 rounded-lg text-sm placeholder:text-grey"
              />
            </FormField>
            <FormField label="New password">
              <Input
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                className="h-10 rounded-lg text-sm placeholder:text-grey"
              />
            </FormField>
            <FormField label="Confirm new password">
              <Input
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="h-10 rounded-lg text-sm placeholder:text-grey"
              />
            </FormField>
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePassword}
              disabled={
                isLoading ||
                !form.oldPassword ||
                !form.newPassword ||
                !form.confirmPassword
              }
            >
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VerifyDialog({
  target,
  onOpenChange,
  onConfirm,
  onResend,
}: {
  target: OtpChannel | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (code: string) => Promise<void>;
  onResend: () => void;
}) {
  const { user, isLoading } = useUser();
  const [error, setError] = useState("");

  const handleConfirm = async (code: string) => {
    setError("");
    try {
      await onConfirm(code);
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100 border-border">
        <DialogHeader>
          <DialogTitle>
            {target === "email"
              ? "Verify your email"
              : "Verify your phone number"}
          </DialogTitle>
          <DialogDescription>
            {target === "email"
              ? `We sent a code to ${user?.email}.`
              : `We sent a code to ${user?.profile?.fullPhone}.`}
          </DialogDescription>
        </DialogHeader>
        <OtpInput
          onConfirm={handleConfirm}
          onResend={onResend}
          isLoading={isLoading}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  value,
  badge,
  badgeOk,
  onVerify,
}: {
  label: string;
  value: string;
  badge?: string;
  badgeOk?: boolean;
  onVerify?: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-grey mb-1">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-foreground truncate">{value}</p>
        {badge && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              badgeOk
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-warning/10 text-warning",
            )}
          >
            {badgeOk ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {badge}
          </span>
        )}
        {onVerify && (
          <button
            onClick={onVerify}
            className="text-[11px] font-medium text-primary hover:underline underline-offset-2"
          >
            Verify now
          </button>
        )}
      </div>
    </div>
  );
}

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <Label className="text-sm font-medium mb-1.5 block text-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-warning mt-1.5">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-sm">
      <div className="w-12 h-12 rounded-lg bg-foreground flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-grey leading-relaxed">{desc}</p>
    </div>
  );
}

export function OtpInput({
  onConfirm,
  onResend,
  isLoading,
  error,
}: {
  onConfirm: (code: string) => void;
  onResend: () => void;
  isLoading: boolean;
  error: string;
}) {
  const [code, setCode] = useState("");
  return (
    <div className="flex flex-col gap-3 mt-2">
      <p className="text-xs text-grey">Enter the 6-digit code we sent you.</p>
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-11 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-lg sm:*:data-[slot=input-otp-slot]:w-12">
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="flex items-center gap-3 w-full justify-center">
          <Button
            size="sm"
            onClick={() => onConfirm(code)}
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? "Confirming..." : "Confirm"}
          </Button>
          <button
            onClick={onResend}
            className="text-xs text-grey hover:text-foreground hover:underline underline-offset-2 transition-colors"
          >
            Resend code
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
