import { z } from "zod";

export const reviewSchema = z.object({
  reviewerName: z.string().trim().min(2).max(60),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(500),
});
