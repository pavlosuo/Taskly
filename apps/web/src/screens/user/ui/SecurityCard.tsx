"use client";

import { useState } from "react";
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
import { Shield, FileLock, ArrowRight, Trash2 } from "lucide-react";
import { useModal } from "@/providers/ModalProvider";
import { useUser } from "@/providers/UserProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { validatePassword } from "@shared/utils";
import { useTranslation } from "react-i18next";
import { SectionCard } from "./SectionCard";
import { FormField } from "./FormField";

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
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
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
