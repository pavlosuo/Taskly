"use client";
import { useState } from "react";
import { useUser } from "@/providers/User";
import {
  PersonalInfoCard,
  PayoutCard,
  SecurityCard,
  VerifyDialog,
} from "@/screens/user/01-account/ui";
import { OtpChannel } from "@shared/types";

export function Account() {
  const { user, sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp } =
    useUser();
  const [verifyTarget, setVerifyTarget] = useState<OtpChannel | null>(null);

  if (!user) return null;

  const openVerify = async (target: OtpChannel | null) => {
    setVerifyTarget(target);
    if (target === "email") await sendEmailOtp();
    if (target === "phone") await sendPhoneOtp();
  };

  const handleConfirmVerify = async (code: string) => {
    if (verifyTarget === "email") await verifyEmailOtp(code);
    if (verifyTarget === "phone") await verifyPhoneOtp(code);
    setVerifyTarget(null);
  };

  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <PersonalInfoCard onVerify={openVerify} />
        <PayoutCard />
        <SecurityCard />
      </div>
      <VerifyDialog
        target={verifyTarget}
        onOpenChange={(o) => !o && setVerifyTarget(null)}
        onConfirm={handleConfirmVerify}
        onResend={() => openVerify(verifyTarget)}
      />
    </section>
  );
}
