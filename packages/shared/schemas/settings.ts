import { z } from "zod";
import { LANGS } from "shared/data";
import type { Lang, Theme, UserSettings } from "shared/types";

export const settingsSchema: z.ZodType<Partial<UserSettings>> = z.object({
  lang: z
    .enum(LANGS.map((lang) => lang.value) as [Lang, ...Lang[]], "lang.invalid")
    .optional(),
  theme: z
    .enum(["light", "dark"] as [Theme, ...Theme[]], "theme.invalid")
    .optional(),
  checkboxes: z
    .object({
      email: z.boolean().optional(),
      phone: z.boolean().optional(),
      privateProfile: z.boolean().optional(),
      noOnlineStatus: z.boolean().optional(),
    })
    .optional(),
});
