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
import { finnishBanks } from "root/include/data";
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

function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export function Main() {
  const {
    user,
    updateProfile,
    sendOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    isLoading,
    deactivateAccount,
  } = useUser();

  const [personalOpen, setPersonalOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [error, setError] = useState("");
  const [phoneOtpStep, setPhoneOtpStep] = useState<"idle" | "sent">("idle");
  const [otpCode, setOtpCode] = useState("");
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

  const handleChange = useCallback(
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
    },
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

  const handleSavePersonal = async () => {
    setError("");
    try {
      await updateProfile({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
      });
      setPersonalOpen(false);
    } catch (err) {
      setError(getAxiosError(err));
    }
  };

  const handleSavePayout = async () => {
    setError("");
    try {
      await updateProfile({ payout: payoutForm });
      setPayoutOpen(false);
    } catch (err) {
      setError(getAxiosError(err));
    }
  };

  const handleSendPhoneOtp = async () => {
    setOtpError("");
    try {
      await sendPhoneOtp();
      setPhoneOtpStep("sent");
    } catch (err) {
      setOtpError(getAxiosError(err));
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setOtpError("");
    try {
      await verifyPhoneOtp(otpCode);
      setPhoneOtpStep("idle");
      setOtpCode("");
    } catch (err) {
      setOtpError(getAxiosError(err));
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
        <div className="grid grid-cols-[400px_1fr] gap-6">
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
                  !user.acceptance.emailVerified ? () => sendOtp() : undefined
                }
              />
              <div>
                <p className="text-xs text-grey mb-1">Phone number</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-foreground">
                    {user.profile?.fullPhone || "—"}
                  </p>
                  <span
                    className={clsx(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      user.acceptance.phoneVerified
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-warning/10 text-warning",
                    )}
                  >
                    {user.acceptance.phoneVerified ? "Verified" : "Unverified"}
                  </span>
                  {!user.acceptance.phoneVerified &&
                    phoneOtpStep === "idle" && (
                      <button
                        onClick={handleSendPhoneOtp}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Verify now
                      </button>
                    )}
                </div>
                {phoneOtpStep === "sent" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="h-8 w-32 rounded-lg text-sm"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerifyPhoneOtp}
                      disabled={isLoading}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={handleSendPhoneOtp}
                      className="text-xs text-grey hover:underline"
                    >
                      Resend
                    </button>
                  </div>
                )}
                {otpError && (
                  <p className="text-xs text-red mt-1">{otpError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[400px_1fr] gap-6">
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
        <div className="grid grid-cols-[400px_1fr] gap-6">
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
      <Dialog open={personalOpen} onOpenChange={setPersonalOpen}>
        <DialogContent className="sm:max-w-xl border-primary">
          <DialogHeader>
            <DialogTitle>Edit personal information</DialogTitle>
            <DialogDescription>
              Update your personal details and contact information.
            </DialogDescription>
          </DialogHeader>
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
              {form.email !== user.email && (
                <p className="text-xs text-warning mt-1">
                  Changing email will require re-verification.
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
              {form.fullPhone !== user.profile?.fullPhone && (
                <p className="text-xs text-warning mt-1">
                  Changing phone will require re-verification.
                </p>
              )}
            </FormField>
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPersonalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePersonal}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                    <SelectItem
                      key={bank.value}
                      value={bank.value}
                      className="flex items-center gap-2"
                    >
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePayout}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
