"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OtpChannel } from "shared/types";
import { useUser } from "@/providers/UserProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { OtpInput } from "@/screens/user/ui";

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
      <DialogContent>
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
