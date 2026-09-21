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
import {
  Landmark,
  Plus,
  Shield,
  FileLock,
  ArrowRight,
  Trash2,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  SquarePen,
  Star,
  BadgeCheck,
  Globe,
  Upload,
  QrCode,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import { FINNISH_BANKS, LANGS } from "@shared/data";
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
import { useModal } from "@/providers/ModalProvider";
import { useUser } from "@/providers/UserProvider";
import { IbanInput, formatIban } from "@/shared/components/IbanInput";
import { getAxiosError } from "@/utils/getAxiosError";
import { validatePassword } from "@shared/utils";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/providers/ThemeProvider";
import parse from "html-react-parser";
import { LanguagesEditor } from "@/screens/user/ui/LanguagesEditor";
import {
  PublicProfileSkill,
  PublicProfileCertificate,
  PublicProfileLang,
} from "@shared/types";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import { Tiptap } from "@/shared/components/Tiptap";
import { SkillsEditor } from "@/screens/user/ui/SkillsEditor";
import { CertificatesEditor } from "@/screens/user/ui/CertificatesEditor";
import { updateProfileSchema } from "@shared/schemas";
import { VideoPlayer } from "@/shared/components/Player";
import { QRCode } from "@/shared/components/QRCode";
import Link from "next/link";

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
    <div className="border border-border bg-background p-4 transition-shadow">
      <div className="w-12 h-12 bg-foreground flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-grey">{desc}</p>
    </div>
  );
}

export function SpanField({
  text,
  subtext,
  icon,
}: {
  text: string;
  subtext?: string;
  icon?: React.ReactNode;
}) {
  if (!text) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">
      {icon}
      <span>
        {text}
        {subtext && (
          <span className="text-[10px] text-grey font-normal ml-1.5">
            {subtext}
          </span>
        )}
      </span>
    </span>
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
      <DialogContent className="sm:max-w-xl border-border w-sm">
        <DialogHeader>
          <DialogTitle>
            {target === "email"
              ? "Verify your email"
              : "Verify your phone number"}
          </DialogTitle>
          <DialogDescription>
            {target === "email"
              ? `We sent a code to ${user?.email}. Enter it below to confirm the change.`
              : `We sent a code to ${user?.profile?.fullPhone}. Enter it below to confirm the change.`}
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
        <DialogContent
          className={clsx(
            "sm:max-w-xl border-border",
            (step === "verify-email" || step === "verify-phone") && "sm:w-sm",
          )}
        >
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

  const bankLabel = FINNISH_BANKS.find(
    (b) => b.value === user.payout?.bankName,
  )?.label;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Landmark className="w-6 h-6 text-background" />}
        title="Payout details"
        desc="Where we send your earnings for completed tasks."
      />
      <div className="border border-border bg-background p-4">
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
          <div className="flex items-center justify-between border border-dashed border-border px-4 py-3">
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
        <DialogContent className="sm:max-w-xl border-border max-h-[85vh] overflow-y-auto">
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
                <SelectTrigger className="h-10 text-sm w-full">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="w-full bg-background">
                  {FINNISH_BANKS.map((bank) => (
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
                className="h-10 text-sm font-mono"
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
  const { t } = useTranslation();
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
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
    const result = validatePassword(form.newPassword);
    if (result !== true) {
      setError(result);
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
          className="w-full grid gap-3 grid-cols-[auto_1fr_auto] items-center py-3 px-4 border border-border text-sm text-foreground hover:bg-foreground/5 transition-colors"
        >
          <FileLock className="w-4 h-4 text-grey" />
          <span className="text-left">Change password</span>
          <ArrowRight className="w-4 h-4 text-grey" />
        </button>
        <button
          onClick={handleDeactivateClick}
          className="w-full grid gap-3 grid-cols-[auto_1fr_auto] items-center py-3 px-4 border border-border text-sm text-red hover:bg-red/5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-left">Deactivate account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Your new password must be at least 8 characters long.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <FormField label="Current password">
              <Input
                name="oldPassword"
                type="password"
                autoComplete="current-password"
                value={form.oldPassword}
                onChange={handleChange("oldPassword")}
              />
            </FormField>
            <FormField label="New password">
              <Input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={handleChange("newPassword")}
              />
            </FormField>
            <FormField label="Confirm new password">
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
              />
            </FormField>
          </div>
          {error && (
            <p className="text-xs text-red">{t(error, { ns: "errors" })}</p>
          )}
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

export function AppearanceCard() {
  const { lang, changeTheme, theme, changeLang } = useTheme();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Globe className="w-6 h-6 text-background" />}
        title="Appearance"
        desc="Choose your language and display theme."
      />
      <div className="border border-border bg-background p-4 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              Language
            </p>
            <p className="text-xs text-grey">
              Choose the app display language.
            </p>
          </div>
          <Select value={lang} onValueChange={changeLang}>
            <SelectTrigger className="w-36 h-9 text-sm relative">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {LANGS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              Dark mode
            </p>
            <p className="text-xs text-grey">
              Switch between light and dark theme.
            </p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) =>
              changeTheme(checked ? "dark" : "light")
            }
          />
        </div>
      </div>
    </div>
  );
}

export function CheckboxesCard({
  list,
  icon,
  title,
  desc,
}: {
  list: { key: string; label: string; desc: string }[];
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const { user, updateProfile } = useUser();
  const [error, setError] = useState("");
  const [local, setLocal] = useState(() => user?.settings?.checkboxes ?? {});

  const toggle = async (key: string, value: boolean) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    try {
      await updateProfile({
        settings: {
          ...user?.settings,
          checkboxes: updated,
        },
      });
    } catch (e) {
      setLocal(local);
      setError(getAxiosError(e));
    }
  };

  if (!user || !list) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
        <SectionCard icon={icon} title={title} desc={desc} />
        <div className="border border-border bg-background p-4 flex flex-col gap-4">
          {list.map((row, i) => (
            <div key={row.key}>
              {i > 0 && <div className="h-px bg-border mb-4" />}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    {row.label}
                  </p>
                  <p className="text-xs text-grey">{row.desc}</p>
                </div>
                <Switch
                  checked={local[row.key as keyof typeof local] ?? true}
                  onCheckedChange={(v) => toggle(row.key, v)}
                />
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-red mt-1">{error}</p>}
        </div>
      </div>
    </>
  );
}

export function PublicProfileCard() {
  const { isOpen } = useMediaPicker();
  const { user, updateProfile, isLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    bio: user?.publicProfile?.bio ?? "",
    skills: user?.publicProfile?.skills ?? ([] as PublicProfileSkill[]),
    certificates:
      user?.publicProfile?.certificates ?? ([] as PublicProfileCertificate[]),
    languages: user?.publicProfile?.languages ?? ([] as PublicProfileLang[]),
  });
  const { openPicker } = useMediaPicker();
  const hasHeader = Boolean(user?.publicProfile?.header);
  const hasIntroduction = Boolean(user?.publicProfile?.introduction);

  const openDialog = () => {
    setForm({
      bio: user?.publicProfile?.bio ?? "",
      skills: user?.publicProfile?.skills ?? [],
      certificates: user?.publicProfile?.certificates ?? [],
      languages: user?.publicProfile?.languages ?? [],
    });
    setError("");
    setOpen(true);
  };

  const handleSave = async () => {
    setError("");
    try {
      const parsed = updateProfileSchema.safeParse({
        publicProfile: form,
      });
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        setError(fieldErrors.publicProfile?.[0] ?? formErrors[0]);
        return;
      }
      await updateProfile({ publicProfile: form });
      setOpen(false);
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  if (!user) return null;

  const p = user.publicProfile;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Star className="w-6 h-6 text-background" />}
        title="Public profile"
        desc="What clients see when they find you on Taskly."
      />
      <div className="border border-border bg-background p-4">
        <div className="flex justify-end mb-4 -mt-1">
          <button
            onClick={openDialog}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 flex items-center gap-1"
          >
            <SquarePen className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs text-grey mb-1">About me</p>
            <div className="text-wrapper">{p?.bio ? parse(p?.bio) : "—"}</div>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">Skills</p>
            {p?.skills?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <SpanField text={s.label} key={s.value} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-grey">No skills added yet.</p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">Certificates</p>
            {p?.certificates?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.certificates.map((c) => {
                  return (
                    <SpanField
                      icon={<BadgeCheck className="w-3.5 h-3.5" />}
                      text={c.label}
                      key={c.value}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-grey">No certificates added yet.</p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">Languages</p>
            {p?.languages?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.languages.map((l) => (
                  <SpanField key={l.value} text={l.label} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-grey">No languages added yet.</p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">
              Add a header for your profile
            </p>
            <div
              className={clsx(
                "group relative h-45 overflow-hidden border transition-colors",
                hasHeader
                  ? "border-border bg-background"
                  : "border-dashed border-border",
              )}
            >
              {hasHeader ? (
                <>
                  <ImageDisplay
                    src={user.publicProfile!.header!.url}
                    alt={user.profile.fullName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/50 to-transparent" />
                  <button
                    type="button"
                    onClick={() =>
                      updateProfile({
                        publicProfile: {
                          ...user.publicProfile,
                          header: null,
                        },
                      })
                    }
                    className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-150 hover:bg-destructive group-hover:opacity-100"
                    aria-label="Remove header image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openPicker({
                      accept: "image",
                      onSelect: (item) => {
                        updateProfile({
                          publicProfile: {
                            ...user.publicProfile,
                            header: item[0],
                          },
                        });
                      },
                    })
                  }
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">Add header image</span>
                </button>
              )}
            </div>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">Add a introduction video</p>
            <div
              className={clsx(
                "relative overflow-hidden border",
                hasIntroduction
                  ? "border-border bg-background"
                  : "h-45 border-dashed border-border",
              )}
            >
              {hasIntroduction ? (
                <div className="group relative aspect-video w-full">
                  <VideoPlayer
                    src={user.publicProfile!.introduction!.url}
                    className="h-full w-full"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateProfile({
                        publicProfile: {
                          ...user.publicProfile,
                          introduction: null,
                        },
                      })
                    }
                    className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-150 hover:bg-destructive group-hover:opacity-100"
                    aria-label="Remove introduction video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openPicker({
                      accept: "video",
                      onSelect: (item) => {
                        updateProfile({
                          publicProfile: {
                            ...user.publicProfile,
                            introduction: item[0],
                          },
                        });
                      },
                    })
                  }
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">
                    Add introduction video
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (isOpen) return;
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-xl border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit public profile</DialogTitle>
            <DialogDescription>
              This is what clients see when they browse taskers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <FormField label="About me">
              <Tiptap
                value={form.bio}
                onUpdate={({ editor }) => {
                  setForm((prev) => ({
                    ...prev,
                    bio: editor.getHTML(),
                  }));
                }}
              />
              <p className="text-xs text-grey text-right mt-1">
                {form.bio.length}/1000
              </p>
            </FormField>
            <div className="h-px bg-border" />
            <div className="flex flex-col">
              <p className="text-sm font-medium text-foreground mb-1">Skills</p>
              <p className="text-xs text-grey mb-2">
                Add skills you have — increases trust with clients.
              </p>
              <SkillsEditor
                value={form.skills}
                onChange={(skills) => {
                  setForm((p) => ({ ...p, skills: skills }));
                }}
              />
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Certificates
              </p>
              <p className="text-xs text-grey mb-2">
                Add certificates you hold — increases trust with clients.
              </p>
              <CertificatesEditor
                value={form.certificates}
                onChange={(certificates) => {
                  setForm((p) => ({ ...p, certificates: certificates }));
                }}
              />
            </div>
            <div className="h-px bg-border" />
            <div className="flex flex-col">
              <p className="text-sm font-medium text-foreground mb-1">
                Languages
              </p>
              <p className="text-xs text-grey mb-2">
                Add languages you speak — increases trust with clients.
              </p>
              <LanguagesEditor
                value={form.languages}
                onChange={(langs) =>
                  setForm((p) => ({ ...p, languages: langs }))
                }
              />
            </div>
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

export function AvatarCard() {
  const { user, updateProfile } = useUser();
  const { openPicker } = useMediaPicker();
  if (!user) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Plus className="w-6 h-6 text-background" />}
        title="Profile photo"
        desc="Your avatar shown to clients and on your public profile."
      />
      <div className="border border-border bg-background p-4">
        <div className="flex items-center gap-4">
          {user.profile?.avatar ? (
            <div className="w-16 h-16 rounded-full object-cover relative">
              <ImageDisplay
                src={user.profile.avatar.url}
                alt={user.profile.fullName}
                className="rounded-full object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() =>
                  updateProfile({
                    avatar: null,
                  })
                }
                className="absolute right-0 bottom-0 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-150 hover:bg-destructive group-hover:opacity-100"
                aria-label="Remove introduction video"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-lg font-medium shrink-0">
              {user.profile?.initials}
            </div>
          )}
          <div>
            <button
              onClick={() =>
                openPicker({
                  accept: "image",
                  onSelect: (item) => {
                    updateProfile({
                      avatar: item[0],
                    });
                  },
                })
              }
              className="text-sm font-medium text-primary hover:underline underline-offset-2 cursor-pointer"
            >
              Change photo
            </button>
            <p className="text-xs text-grey mt-0.5">JPG, PNG — max 10MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QRCard() {
  const { user } = useUser();
  if (!user) return null;
  const link = user.publicLink || "";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<QrCode className="w-6 h-6 text-background" />}
        title="QR Code"
        desc="Your QR Code. Share it with your clients."
      />
      <div className="border border-border bg-background p-4 flex justify-between items-end">
        <Button variant="link" asChild>
          <Link href={link} target="_blank" className="flex items-center gap-1">
            <span>View my profile</span>
            <ArrowUpRight className="w-6 h-6" />
          </Link>
        </Button>
        <QRCode url={link} name={`@${user.username}`} />
      </div>
    </div>
  );
}
