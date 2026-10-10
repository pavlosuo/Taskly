"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { FieldError } from "@/components/shared/FieldError";
import { RESEND_COOLDOWN_SECONDS } from "shared/index";

export function OtpInput({
  onConfirm,
  onResend,
  isLoading,
  error,
}: {
  onConfirm: (code: string) => void;
  onResend: () => void;
  isLoading: boolean;
  error?: string;
}) {
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    onResend();
    setCode("");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

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
            {isLoading ? "Loading..." : "Confirm"}
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-xs text-grey hover:text-foreground hover:underline underline-offset-2 transition-colors disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </div>
      </div>
      <FieldError message={error} icon />
    </div>
  );
}
