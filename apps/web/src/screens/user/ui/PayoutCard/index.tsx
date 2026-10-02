"use client";
import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Landmark, Plus, SquarePen } from "lucide-react";
import { FINNISH_BANKS } from "shared/data";
import { payoutSchema, Payout, ZodErrors } from "shared/index";
import { IbanInput, formatIban } from "@/components/shared/Input";
import { useUser } from "@/providers/UserProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { SectionCard, Field, FormField } from "@/screens/user/ui";
import { FieldError } from "@/components/shared/FieldError";

export function PayoutCard() {
  const { user, isLoading, updateProfile } = useUser();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ZodErrors<Payout>>({});
  const [form, setForm] = useState<Payout>({
    iban: user?.payout?.iban ?? "",
    bankName: user?.payout?.bankName ?? "",
  });

  const openDialog = () => {
    setForm({
      iban: user?.payout?.iban ?? "",
      bankName: user?.payout?.bankName ?? "",
    });
    setErrors({});
    setOpen(true);
  };

  const handleChange = (field: keyof Payout, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
  };

  const handleSave = async () => {
    setErrors({});
    try {
      const parsed = payoutSchema.safeParse(form);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        setErrors({
          bankName: fieldErrors.bankName?.[0],
          iban: fieldErrors.iban?.[0],
          general: formErrors[0],
        });
        return;
      }
      await updateProfile({ payout: form });
      setOpen(false);
    } catch (e) {
      setErrors({ general: getAxiosError(e) });
    }
  };

  if (!user) return null;

  const bankLabel = FINNISH_BANKS.find(
    (b) => b.value === user.payout?.bankName,
  )?.label;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Landmark className="w-6 h-6 text-background" />}
        title="Payout details"
        desc="Where we send your earnings for completed tasks."
      />
      <div className="border border-border bg-background p-4">
        <div className="flex justify-end mb-4 -mt-1">
          <button
            onClick={openDialog}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            {user.payout?.iban ? (
              <>
                <SquarePen className="w-4 h-4" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
        {user.payout?.iban ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            <Field label="IBAN" value={formatIban(user.payout.iban)} />
            {bankLabel && <Field label="Bank" value={bankLabel} />}
          </div>
        ) : (
          <div className="flex items-center justify-between border border-dashed border-border px-4 py-3">
            <p className="text-xs text-grey">
              No payout method added yet — add one to get paid out.
            </p>
            <button
              onClick={openDialog}
              className="text-xs font-medium text-primary hover:underline underline-offset-2 shrink-0 ml-3"
            >
              Add now
            </button>
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit payout details</DialogTitle>
            <DialogDescription>
              We&apos;ll transfer your earnings to this account after each
              completed task.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <FormField label="Bank" htmlFor="bankName" error={errors.bankName}>
              <Select
                value={form.bankName}
                onValueChange={(value) => handleChange("bankName", value)}
              >
                <SelectTrigger
                  id="bankName"
                  className={clsx(
                    "h-10 text-sm w-full",
                    errors.bankName && "border-destructive",
                  )}
                >
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="w-full bg-background">
                  {FINNISH_BANKS.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      <Image
                        className="w-5 h-5"
                        src={bank.src}
                        alt={bank.label}
                        width={20}
                        height={20}
                      />
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="IBAN" htmlFor="iban" error={errors.iban}>
              <IbanInput
                id="iban"
                value={form.iban}
                onChange={(value) => handleChange("iban", value)}
                error={errors.iban}
                className="h-10 text-sm font-mono"
              />
            </FormField>
          </div>
          <FieldError message={errors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
