"use client";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OtpChannel } from "shared/types";
import { useUser } from "@/providers/UserProvider";
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
  const { t } = useTranslation("profile");
  const { user, isLoading } = useUser();

  const handleConfirm = async (code: string) => {
    try {
      await onConfirm(code);
    } catch {}
  };

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {target === "email"
              ? t("verify.emailTitle")
              : t("verify.phoneTitle")}
          </DialogTitle>
          <DialogDescription>
            {target === "email"
              ? t("verify.emailDesc", {
                  value: user?.email,
                  interpolation: { escapeValue: false },
                })
              : t("verify.phoneDesc", {
                  value: user?.profile?.fullPhone,
                  interpolation: { escapeValue: false },
                })}
          </DialogDescription>
        </DialogHeader>
        <OtpInput
          onConfirm={handleConfirm}
          onResend={onResend}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
