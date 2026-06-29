"use client";
import { useState, useCallback } from "react";
import { useUser } from "providers/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAxiosError } from "@/utils/getAxiosError";
import { finnishBanks } from "root/apps/api/include/data";
import {
  User as UserIcon,
  Shield,
  FileLock,
  ArrowRight,
  Trash2,
  SquarePen,
  Landmark,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import { PhoneInput } from "@/shared/components/PhoneInput";
import Image from "next/image";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// ─── вспомогательные компоненты ──────────────────────────────────────────────

function Field({
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
        <p className="text-sm text-foreground">{value}</p>
        {badge && (
          <span
            className={clsx(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              badgeOk
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-warning/10 text-warning",
            )}
          >
            {badge}
          </span>
        )}
        {onVerify && (
          <button
            onClick={onVerify}
            className="text-[11px] text-primary hover:underline"
          >
            Verify now
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <Label className="text-sm font-medium mb-1.5 block text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="w-12 h-12 rounded-md bg-foreground flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-grey leading-relaxed">{desc}</p>
    </div>
  );
}

function OtpInput({
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
    <div className="flex flex-col gap-2 mt-3">
      <p className="text-xs text-grey">Enter the 6-digit code we sent you.</p>
      <div className="flex flex-col gap-4">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
          }}
        >
          <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:text-xl">
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onConfirm(code)}
            disabled={isLoading || code.length !== 6}
          >
            Confirm
          </Button>
          <button
            onClick={onResend}
            className="text-xs text-grey hover:underline"
          >
            Resend
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}

function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

// ─── главный компонент ────────────────────────────────────────────────────────

type OtpDialogTarget = "email" | "phone" | null;
type PersonalStep = "form" | "verify-email" | "verify-phone";

export function Main() {
  const {
    user,
    updateProfile,
    sendOtp,
    verifyOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    isLoading,
    deactivateAccount,
  } = useUser();

  console.log("user", user);

  // диалоги
  const [personalOpen, setPersonalOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [otpDialogTarget, setOtpDialogTarget] = useState<OtpDialogTarget>(null);

  // шаг внутри диалога персональных данных
  const [personalStep, setPersonalStep] = useState<PersonalStep>("form");

  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");

  const [form, setForm] = useState({
    fullName: user?.profile?.fullName ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    fullPhone: user?.profile?.fullPhone ?? "",
    phone: user?.profile?.phone ?? "",
    code: user?.profile?.code ?? "",
  });

  const [payoutForm, setPayoutForm] = useState({
    iban: user?.payout?.iban ?? "",
    bankName: user?.payout?.bankName ?? "",
  });

  const emailChanged = form.email !== user?.email;
  const phoneChanged = form.fullPhone !== user?.profile?.fullPhone;

  const handleChange = useCallback(
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value })),
    [],
  );

  const handleLocalPhone = useCallback(
    (phone: string) => {
      setForm((p) => ({
        ...p,
        phone,
        fullPhone: form.code + phone.replace(/\s/g, ""),
      }));
    },
    [form.code],
  );

  const openPersonal = () => {
    setForm({
      fullName: user?.profile?.fullName ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      fullPhone: user?.profile?.fullPhone ?? "",
      phone: user?.profile?.phone ?? "",
      code: user?.profile?.code ?? "",
    });
    setError("");
    setPersonalStep("form");
    setPersonalOpen(true);
  };

  const openPayout = () => {
    setPayoutForm({
      iban: user?.payout?.iban ?? "",
      bankName: user?.payout?.bankName ?? "",
    });
    setError("");
    setPayoutOpen(true);
  };

  // ── сохранение личных данных ──────────────────────────────────────────────
  const handleSavePersonal = async () => {
    setError("");
    try {
      await updateProfile({
        fullName: form.fullName,
        username: form.username,
        email: emailChanged ? form.email : undefined,
        phone: phoneChanged ? form.fullPhone : undefined,
      });

      if (emailChanged) {
        await sendOtp(); // отправляем код на новый email
        setPersonalStep("verify-email");
        return;
      }
      if (phoneChanged) {
        await sendPhoneOtp(); // отправляем код на новый телефон
        setPersonalStep("verify-phone");
        return;
      }

      setPersonalOpen(false);
    } catch (err) {
      setError(getAxiosError(err));
    }
  };

  // ── подтверждение кода внутри диалога ────────────────────────────────────
  const handleConfirmEmailCode = async (code: string) => {
    setOtpError("");
    try {
      await verifyOtp(code);
      setPersonalOpen(false);
      setPersonalStep("form");
    } catch (err) {
      setOtpError(getAxiosError(err));
    }
  };

  const handleConfirmPhoneCode = async (code: string) => {
    setOtpError("");
    try {
      await verifyPhoneOtp(code);
      setPersonalOpen(false);
      setPersonalStep("form");
    } catch (err) {
      setOtpError(getAxiosError(err));
    }
  };

  // ── verify now (без смены) ────────────────────────────────────────────────
  const handleOpenOtpDialog = async (target: OtpDialogTarget) => {
    setOtpError("");
    setOtpDialogTarget(target);
    if (target === "email") await sendOtp();
    if (target === "phone") await sendPhoneOtp();
  };

  const handleConfirmOtpDialog = async (code: string) => {
    setOtpError("");
    try {
      if (otpDialogTarget === "email") await verifyOtp(code);
      if (otpDialogTarget === "phone") await verifyPhoneOtp(code);
      setOtpDialogTarget(null);
    } catch (err) {
      setOtpError(getAxiosError(err));
    }
  };

  // ── payout ────────────────────────────────────────────────────────────────
  const handleSavePayout = async () => {
    setError("");
    try {
      await updateProfile({ payout: payoutForm });
      setPayoutOpen(false);
    } catch (err) {
      setError(getAxiosError(err));
    }
  };

  const handleDeactivate = async () => {
    if (
      !confirm(
        "Are you sure you want to deactivate your account? This cannot be undone.",
      )
    )
      return;
    deactivateAccount();
  };

  if (!user) return null;

  const bankLabel = finnishBanks.find(
    (b) => b.value === user.payout?.bankName,
  )?.label;

  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        {/* ── personal ── */}
        <div className="grid grid-cols-[400px_1fr] gap-6 items-start">
          <SectionCard
            icon={<UserIcon className="w-6 h-6 text-background" />}
            title="Personal information"
            desc="Manage your basic account details and contact information."
          />
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex justify-end mb-4 -mt-1">
              <button
                onClick={openPersonal}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <SquarePen className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <Field label="Full name" value={user.profile?.fullName || "—"} />
              <Field label="Username" value={user.username} />
              <Field
                label="Email"
                value={user.email}
                badge={
                  user.acceptance.emailVerified ? "Verified" : "Unverified"
                }
                badgeOk={user.acceptance.emailVerified}
                onVerify={
                  !user.acceptance.emailVerified
                    ? () => handleOpenOtpDialog("email")
                    : undefined
                }
              />
              <Field
                label="Phone number"
                value={user.profile?.fullPhone || "—"}
                badge={
                  user.acceptance.phoneVerified ? "Verified" : "Unverified"
                }
                badgeOk={user.acceptance.phoneVerified}
                onVerify={
                  !user.acceptance.phoneVerified
                    ? () => handleOpenOtpDialog("phone")
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* ── payout ── */}
        <div className="grid grid-cols-[400px_1fr] gap-6 items-start">
          <SectionCard
            icon={<Landmark className="w-6 h-6 text-background" />}
            title="Payout details"
            desc="Where we send your earnings for completed tasks."
          />
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex justify-end mb-4 -mt-1">
              <button
                onClick={openPayout}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
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
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <Field label="IBAN" value={formatIban(user.payout.iban)} />
                {bankLabel && <Field label="Bank" value={bankLabel} />}
              </div>
            ) : (
              <p className="text-xs text-grey">No payout method added yet.</p>
            )}
          </div>
        </div>

        {/* ── security ── */}
        <div className="grid grid-cols-[400px_1fr] gap-6 items-start">
          <SectionCard
            icon={<Shield className="w-6 h-6 text-background" />}
            title="Security"
            desc="Update your password and control account access."
          />
          <div className="flex flex-col gap-2">
            <button className="w-full grid gap-2 grid-cols-[auto_1fr_auto] items-center py-3 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-foreground/10 transition-colors">
              <FileLock className="w-4 h-4" />
              <span className="text-left">Change password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeactivate}
              className="w-full grid gap-2 grid-cols-[auto_1fr_auto] items-center py-3 px-4 rounded-lg border border-border text-sm text-red hover:bg-red/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-left">Deactivate account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── диалог personal ── */}
      <Dialog
        open={personalOpen}
        onOpenChange={(o) => {
          setPersonalOpen(o);
          if (!o) setPersonalStep("form");
        }}
      >
        <DialogContent className="sm:max-w-xl border-primary">
          <DialogHeader>
            <DialogTitle>
              {personalStep === "form" && "Edit personal information"}
              {personalStep === "verify-email" && "Verify your new email"}
              {personalStep === "verify-phone" &&
                "Verify your new phone number"}
            </DialogTitle>
            <DialogDescription>
              {personalStep === "form" &&
                "Update your personal details and contact information."}
              {personalStep === "verify-email" &&
                `We sent a code to ${form.email}. Enter it below to confirm the change.`}
              {personalStep === "verify-phone" &&
                `We sent a code to ${form.fullPhone}. Enter it below to confirm the change.`}
            </DialogDescription>
          </DialogHeader>

          {personalStep === "form" && (
            <>
              <div className="grid grid-cols-2 gap-4 py-2">
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
                <FormField label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    className="h-10 rounded-lg text-sm placeholder:text-grey"
                  />
                  {emailChanged && (
                    <p className="text-xs text-warning mt-1">
                      Changing email will require verification.
                    </p>
                  )}
                </FormField>
                <FormField label="Phone number">
                  <PhoneInput
                    code={form.code}
                    setCode={(code) => setForm((p) => ({ ...p, code }))}
                    value={form.phone}
                    onChange={handleLocalPhone}
                    id="phone"
                  />
                  {phoneChanged && (
                    <p className="text-xs text-warning mt-1">
                      Changing phone will require verification.
                    </p>
                  )}
                </FormField>
              </div>
              {error && <p className="text-xs text-red">{error}</p>}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPersonalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePersonal} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          )}

          {personalStep === "verify-email" && (
            <OtpInput
              onConfirm={handleConfirmEmailCode}
              onResend={sendOtp}
              isLoading={isLoading}
              error={otpError}
            />
          )}

          {personalStep === "verify-phone" && (
            <OtpInput
              onConfirm={handleConfirmPhoneCode}
              onResend={sendPhoneOtp}
              isLoading={isLoading}
              error={otpError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── диалог verify now (без смены) ── */}
      <Dialog
        open={!!otpDialogTarget}
        onOpenChange={(o) => {
          if (!o) setOtpDialogTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm border-primary">
          <DialogHeader>
            <DialogTitle>
              {otpDialogTarget === "email"
                ? "Verify your email"
                : "Verify your phone number"}
            </DialogTitle>
            <DialogDescription>
              {otpDialogTarget === "email"
                ? `We sent a code to ${user.email}.`
                : `We sent a code to ${user.profile?.fullPhone}.`}
            </DialogDescription>
          </DialogHeader>
          <OtpInput
            onConfirm={handleConfirmOtpDialog}
            onResend={() => handleOpenOtpDialog(otpDialogTarget)}
            isLoading={isLoading}
            error={otpError}
          />
        </DialogContent>
      </Dialog>

      {/* ── диалог payout ── */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-xl border-primary">
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
                value={payoutForm.bankName}
                onValueChange={(value) =>
                  setPayoutForm((p) => ({ ...p, bankName: value }))
                }
              >
                <SelectTrigger className="h-10 rounded-lg text-sm w-full">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="w-full bg-background">
                  {finnishBanks.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      <Image
                        className="w-7 h-7"
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
              <Input
                placeholder="FI21 1234 5600 0007 85"
                value={payoutForm.iban}
                onChange={(e) =>
                  setPayoutForm((p) => ({ ...p, iban: e.target.value }))
                }
                className="h-10 rounded-lg text-sm font-mono"
              />
            </FormField>
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayout} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
