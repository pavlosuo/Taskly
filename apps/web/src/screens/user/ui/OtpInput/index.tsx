"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
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
  onResend: () => void | Promise<void>;
  isLoading: boolean;
  error?: string;
}) {
  const { t } = useTranslation("profile");
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    try {
      await onResend();
    } catch {
      return;
    }
    setCode("");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div className="flex flex-col gap-3 mt-2">
      <p className="text-xs text-grey">{t("otp.hint")}</p>
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoFocus
            onComplete={(full) => {
              if (!isLoading) onConfirm(full);
            }}
          >
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
            {isLoading ? t("otp.checking") : t("otp.confirm")}
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className="text-xs text-grey hover:text-foreground hover:underline underline-offset-2 transition-colors disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {resendCooldown > 0
              ? t("otp.resendIn", { seconds: resendCooldown })
              : t("otp.resend")}
          </button>
        </div>
      </div>
      <FieldError message={error} icon />
    </div>
  );
}
