import { z } from "zod";
import { MESSAGE_MAX_LENGTH, MAX_LIST_ITEMS } from "shared/data";
import type { Deadline } from "shared/types";
import { priceField, sanitizedText } from "./fields";
import {
  publicProfileCertificateSchema,
  publicProfileSkillSchema,
} from "./public-profile";

export const taskLocationSchema = z.object({
  address: z
    .string()
    .trim()
    .min(1, "task.location.required")
    .min(3, "task.location.tooShort")
    .max(200, "task.location.tooLong"),
  lat: z
    .number()
    .finite("task.location.invalidLatitude")
    .min(-90, "task.location.invalidLatitude")
    .max(90, "task.location.invalidLatitude"),
  lng: z
    .number()
    .finite("task.location.invalidLongitude")
    .min(-180, "task.location.invalidLongitude")
    .max(180, "task.location.invalidLongitude"),
});

export const taskBudgetSchema = z
  .object({
    amount: priceField.optional(),
    negotiable: z.boolean().default(false),
  })
  .refine((b) => b.negotiable || b.amount !== undefined, {
    message: "task.price.required",
    path: ["amount"],
  });

export const taskDeadlineSchema: z.ZodType<Deadline> = z.object({
  date: z.coerce
    .date("task.date.required")
    .refine((date) => !Number.isNaN(date.getTime()), "task.date.invalid")
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "task.date.invalid"),
  time: z
    .string()
    .min(1, "task.time.required")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
      message: "task.time.invalid",
    }),
});

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "task.title.required")
    .min(5, "task.title.tooShort")
    .max(80, "task.title.tooLong"),
  description: z
    .string()
    .min(1, "task.description.required")
    .min(20, "task.description.tooShort")
    .max(MESSAGE_MAX_LENGTH, "task.description.tooLong"),
  skills: z
    .array(publicProfileSkillSchema)
    .max(MAX_LIST_ITEMS, "task.skills.tooMany")
    .default([]),
  certificates: z
    .array(publicProfileCertificateSchema)
    .max(MAX_LIST_ITEMS, "task.certificates.tooMany")
    .default([]),
  budget: taskBudgetSchema,
  location: taskLocationSchema,
  deadline: taskDeadlineSchema,
});

export const taskUpdateSchema = taskCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "task.update.empty");

export const taskResponseCreateSchema = z.object({
  message: sanitizedText(MESSAGE_MAX_LENGTH, "task.message.tooLong")
    .refine((value) => value.length >= 10, "task.message.tooShort")
    .optional(),
  price: priceField.optional(),
});
