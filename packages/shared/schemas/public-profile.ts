import { z } from "zod";
import {
  CERF,
  MESSAGE_MAX_LENGTH,
  WORLD_LANGUAGES,
  MAX_LIST_ITEMS,
} from "shared/data";
import type {
  PublicProfile,
  PublicProfileCertificate,
  PublicProfileLang,
  PublicProfileSkill,
} from "shared/types";
import { removeHtml } from "shared/utils";
import { sanitizedText } from "./fields";
import { mediaItemSchema } from "./media";

export const publicProfileLangSchema: z.ZodType<PublicProfileLang> = z.object({
  value: z.enum(
    WORLD_LANGUAGES.map((lang) => lang.value),
    "language.value.invalid",
  ),
  label: z.enum(
    WORLD_LANGUAGES.map((lang) => lang.label),
    "language.label.invalid",
  ),
  level: z.enum(CERF, { message: "language.level.invalid" }),
  certificate: z
    .object({
      media: mediaItemSchema,
      description: z
        .string()
        .transform(removeHtml)
        .refine(
          (value) => value.length <= MESSAGE_MAX_LENGTH,
          "language.certificate.tooLong",
        )
        .optional(),
    })
    .optional(),
});

export const publicProfileSkillSchema: z.ZodType<PublicProfileSkill> = z.object(
  {
    value: z
      .string()
      .trim()
      .min(1, "skill.value.required")
      .max(100, "skill.value.tooLong"),
    label: z
      .string()
      .trim()
      .min(1, "skill.label.required")
      .max(100, "skill.label.tooLong"),
    description: sanitizedText(500, "skill.description.tooLong")
      .refine((value) => value.length >= 1, "skill.description.required")
      .optional(),
  },
);

export const publicProfileCertificateSchema: z.ZodType<PublicProfileCertificate> =
  z.object({
    value: z
      .string()
      .trim()
      .min(1, "certificate.value.required")
      .max(100, "certificate.value.tooLong"),
    label: z
      .string()
      .trim()
      .min(1, "certificate.label.required")
      .max(100, "certificate.label.tooLong"),
    media: mediaItemSchema.nullable().optional(),
  });

export const publicProfileSchema: z.ZodType<PublicProfile> = z.object({
  bio: sanitizedText(MESSAGE_MAX_LENGTH, "bio.tooLong").optional(),
  skills: z
    .array(publicProfileSkillSchema)
    .max(MAX_LIST_ITEMS, "skills.tooMany")
    .optional(),
  certificates: z
    .array(publicProfileCertificateSchema)
    .max(MAX_LIST_ITEMS, "certificates.tooMany")
    .optional(),
  languages: z
    .array(publicProfileLangSchema)
    .min(1, "languages.required")
    .optional(),
  header: mediaItemSchema.nullable().optional(),
  introduction: mediaItemSchema.nullable().optional(),
});
