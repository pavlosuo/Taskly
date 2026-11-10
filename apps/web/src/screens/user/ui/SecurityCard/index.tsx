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
import {
  changePasswordSchema,
  ChangePasswordForm,
  ZodErrors,
  getPasswordStrength,
} from "shared/index";
import { SectionCard, FormField } from "@/screens/user/ui";
import clsx from "clsx";
import { useTranslation } from "@/hooks/useTranslation";
import { PasswordToggle } from "@/screens/auth/ui";
import { useToast } from "@/hooks/useToast";

export function SecurityCard() {
  const { t } = useTranslation(["profile", "errors"]);
  const toast = useToast();
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
  const [show, setShow] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

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
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleDeactivateClick = () => {
    confirm(t("profile:deactivateAccount")).then((confirmed) => {
      if (!confirmed) return;
      setDeletePassword("");
      setShowDeletePassword(false);
      setDeleteOpen(true);
    });
  };

  const handleDeactivateConfirm = async () => {
    if (!deletePassword) return;
    try {
      await deactivateAccount(deletePassword);
      setDeleteOpen(false);
    } catch {}
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
        });
        toast(formErrors[0]);
        return;
      }
      await changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setOpen(false);
    } catch {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Shield aria-hidden="true" className="w-6 h-6 text-background" />}
        title={t("security.title")}
        desc={t("security.desc")}
      />
      <div className="flex flex-col gap-2">
        <button
          onClick={handlePasswordClick}
          className="w-full grid gap-3 grid-cols-[auto_1fr_auto] items-center py-3 px-4 border border-border text-sm text-foreground hover:bg-foreground/5 transition-colors"
        >
          <FileLock aria-hidden="true" className="w-4 h-4 text-foreground" />
          <span className="text-left">{t("security.changePassword")}</span>
          <ArrowRight aria-hidden="true" className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={handleDeactivateClick}
          className="w-full grid gap-3 grid-cols-[auto_1fr_auto] items-center py-3 px-4 border border-border text-sm text-destructive hover:bg-destructive/5 transition-colors"
        >
          <Trash2 aria-hidden="true" className="w-4 h-4" />
          <span className="text-left">{t("security.deactivate")}</span>
          <ArrowRight aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("security.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("security.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <FormField
              label={t("security.currentPassword")}
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
              label={t("security.newPassword")}
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
                <p
                  aria-live="polite"
                  className={clsx("text-xs mt-1 font-medium", strength.color)}
                >
                  {t(`errors:${strength.tips[0] ?? strength.label}`)}
                </p>
              )}
            </FormField>
            <FormField
              label={t("security.confirmPassword")}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={handleSavePassword} disabled={isLoading}>
              {isLoading ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("security.deleteDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("security.deleteDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <FormField
              label={t("security.currentPassword")}
              htmlFor="deletePassword"
            >
              <div className="relative">
                <Input
                  name="deletePassword"
                  type={showDeletePassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="pr-10"
                />
                <PasswordToggle
                  show={showDeletePassword}
                  onToggle={() => setShowDeletePassword((p) => !p)}
                />
              </div>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateConfirm}
              disabled={isLoading || !deletePassword}
            >
              {t("security.deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
