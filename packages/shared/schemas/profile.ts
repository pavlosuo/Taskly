import { z } from "zod";
import type { UpdateProfileForm } from "shared/types";
import {
  emailField,
  fullNameSchema,
  phoneCodeField,
  phoneField,
  phoneNumberPartField,
  urlField,
  usernameField,
} from "./fields";
import { mediaItemSchema } from "./media";
import { payoutSchema } from "./payout";
import { publicProfileSchema } from "./public-profile";
import { settingsSchema } from "./settings";

export const updateProfileSchema: z.ZodType<UpdateProfileForm> = z.object({
  username: usernameField.optional(),
  publicLink: urlField.min(1, "publicLink.required").optional(),
  fullName: fullNameSchema.optional(),
  fullPhone: phoneField.optional(),
  phone: phoneNumberPartField.optional(),
  code: phoneCodeField.optional(),
  email: emailField.optional(),
  avatar: mediaItemSchema.nullable().optional(),
  payout: payoutSchema.optional(),
  settings: settingsSchema.optional(),
  publicProfile: publicProfileSchema.optional(),
}) as z.ZodType<UpdateProfileForm>;
