"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/shared/Input";
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
import {
  changePasswordSchema,
  ChangePasswordForm,
  ZodErrors,
  getPasswordStrength,
} from "shared/index";
import { SectionCard, FormField } from "@/screens/user/ui";
import { FieldError } from "@/components/shared/FieldError";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { PasswordToggle } from "@/screens/auth/ui";

export function SecurityCard() {
  const { deactivateAccount, changePassword, isLoading } = useUser();
  const { confirm } = useModal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ChangePasswordForm>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ZodErrors<ChangePasswordForm>>({});
  const strength = getPasswordStrength(form.newPassword);
  const { t: tErrors } = useTranslation("errors");
  const [show, setShow] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleToggle = (field: keyof typeof show) => () =>
    setShow((p) => ({ ...p, [field]: !p[field] }));

  const handlePasswordClick = () => {
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setShow({ oldPassword: false, newPassword: false, confirmPassword: false });
    setErrors({});
    setOpen(true);
  };

  const handleChange = (field: keyof ChangePasswordForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
  };

  const handleDeactivateClick = () => {
    confirm("confirm.deactivateAccount").then((confirmed) => {
      if (confirmed) deactivateAccount();
    });
  };

  const handleSavePassword = async () => {
    setErrors({});
    try {
      const parsed = changePasswordSchema.safeParse(form);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        setErrors({
          oldPassword: fieldErrors.oldPassword?.[0],
          newPassword: fieldErrors.newPassword?.[0],
          confirmPassword: fieldErrors.confirmPassword?.[0],
          general: formErrors[0],
        });
        return;
      }
      await changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setOpen(false);
    } catch (e) {
      setErrors({
        general: getAxiosError(e),
      });
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
          className="w-full grid gap-3 grid-cols-[auto_1fr_auto] items-center py-3 px-4 border border-border text-sm text-destructive hover:bg-destructive/5 transition-colors"
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
            <FormField
              label="Current password"
              htmlFor="oldPassword"
              error={errors.oldPassword}
            >
              <div className="relative">
                <Input
                  name="oldPassword"
                  type={show.oldPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.oldPassword}
                  onChange={(e) => handleChange("oldPassword", e.target.value)}
                  error={errors.oldPassword}
                  className="pr-10"
                />
                <PasswordToggle
                  show={show.oldPassword}
                  onToggle={handleToggle("oldPassword")}
                />
              </div>
            </FormField>
            <FormField
              label="New password"
              htmlFor="newPassword"
              error={errors.newPassword}
            >
              <div className="relative">
                <Input
                  name="newPassword"
                  type={show.newPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  error={errors.newPassword}
                  className="pr-10"
                />
                <PasswordToggle
                  show={show.newPassword}
                  onToggle={handleToggle("newPassword")}
                />
              </div>
              {strength && !errors.newPassword && (
                <p className={clsx("text-xs mt-1 font-medium", strength.color)}>
                  {tErrors(strength.tips[0] ?? strength.label)}
                </p>
              )}
            </FormField>
            <FormField
              label="Confirm new password"
              htmlFor="confirmPassword"
              error={errors.confirmPassword}
            >
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={show.confirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  error={errors.confirmPassword}
                  className="pr-10"
                />
                <PasswordToggle
                  show={show.confirmPassword}
                  onToggle={handleToggle("confirmPassword")}
                />
              </div>
            </FormField>
            <FieldError message={errors.general} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePassword} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
