import { z } from "zod";
import { FINNISH_BANKS_VALUES } from "shared/data";
import { validateIban } from "shared/utils";
import type { Payout } from "shared/types";

export const payoutSchema: z.ZodType<Payout> = z.object({
  iban: z
    .string()
    .trim()
    .min(1, "iban.required")
    .transform((value) => value.replace(/\s/g, "").toUpperCase())
    .refine(validateIban, { message: "iban.invalid" }),
  bankName: z.enum(FINNISH_BANKS_VALUES, { message: "bankName.invalid" }),
});
