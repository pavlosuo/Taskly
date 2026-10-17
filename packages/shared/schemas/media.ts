import { z } from "zod";
import { MAX_FILE_SIZE } from "shared/data";
import type { MediaItem } from "shared/types";
import { idField, urlField } from "./fields";

export const mediaItemSchema = z.object({
  _id: idField,
  ownerId: idField,
  url: urlField,
  filename: z
    .string()
    .trim()
    .min(1, "media.filename.required")
    .max(255, "media.filename.tooLong"),
  originalName: z
    .string()
    .trim()
    .min(1, "media.originalName.required")
    .max(255, "media.originalName.tooLong"),
  size: z
    .number()
    .finite("media.size.invalid")
    .int("media.size.invalid")
    .positive("media.size.invalid")
    .max(MAX_FILE_SIZE, "media.size.tooLarge"),
  mimeType: z
    .string()
    .trim()
    .min(1, "media.mimeType.required")
    .max(100, "media.mimeType.invalid"),
  uploadedAt: z.coerce.date(),
  publicSources: z.array(urlField),
  chatIds: z.array(idField),
}) satisfies z.ZodType<MediaItem>;
