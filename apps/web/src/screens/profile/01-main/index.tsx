"use client";
import { useState } from "react";
import { useUser } from "@/providers/User";
import {
  PersonalInfoCard,
  PayoutCard,
  SecurityCard,
  VerifyDialog,
  type VerifyTarget,
} from "@/screens/profile/ui";

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

  const [verifyTarget, setVerifyTarget] = useState<VerifyTarget>(null);
  const [otpError, setOtpError] = useState("");

  if (!user) return null;

  const openVerify = async (target: VerifyTarget) => {
    setOtpError("");
    setVerifyTarget(target);
    if (target === "email") await sendOtp();
    if (target === "phone") await sendPhoneOtp();
  };

  const handleConfirmVerify = async (code: string) => {
    setOtpError("");
    try {
      if (verifyTarget === "email") await verifyOtp(code);
      if (verifyTarget === "phone") await verifyPhoneOtp(code);
      setVerifyTarget(null);
    } catch {
      setOtpError("Invalid code. Please try again.");
    }
  };

  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <PersonalInfoCard
          user={user}
          isLoading={isLoading}
          updateProfile={updateProfile}
          sendOtp={sendOtp}
          verifyOtp={verifyOtp}
          sendPhoneOtp={sendPhoneOtp}
          verifyPhoneOtp={verifyPhoneOtp}
          onVerify={openVerify}
        />
        <PayoutCard
          user={user}
          isLoading={isLoading}
          updateProfile={updateProfile}
        />
        <SecurityCard onDeactivate={deactivateAccount} />
      </div>
      <VerifyDialog
        target={verifyTarget}
        email={user.email}
        phone={user.profile?.fullPhone ?? ""}
        isLoading={isLoading}
        error={otpError}
        onOpenChange={(o) => !o && setVerifyTarget(null)}
        onConfirm={handleConfirmVerify}
        onResend={() => openVerify(verifyTarget)}
      />
    </section>
  );
}
