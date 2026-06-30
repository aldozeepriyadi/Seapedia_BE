import { z } from "zod";
import {
  isSafePlainText,
  normalizePlainText,
  safePlainTextMessage,
} from "../utils/security";

export const reviewSchema = z.object({
  reviewerName: z
    .string()
    .trim()
    .min(2, "Nama reviewer minimal 2 karakter.")
    .max(60, "Nama reviewer maksimal 60 karakter.")
    .refine(isSafePlainText, safePlainTextMessage)
    .transform(normalizePlainText),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(4, "Komentar minimal 4 karakter.")
    .max(500, "Komentar maksimal 500 karakter.")
    .refine(isSafePlainText, safePlainTextMessage)
    .transform(normalizePlainText),
});
