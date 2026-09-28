"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AlertCircle } from "lucide-react";

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
