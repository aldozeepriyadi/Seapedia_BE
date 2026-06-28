import { Request, Response } from "express";
import { ReviewModel } from "../models/review.model";
import { createId } from "../services/id.service";
import { reviewSchema } from "../validators/review.validator";

export class ReviewController {
  static async index(_req: Request, res: Response) {
    const reviews = await ReviewModel.findMany();
    res.json({ reviews });
  }

  static async store(req: Request, res: Response) {
    const payload = reviewSchema.parse(req.body);
    const review = await ReviewModel.create({
      id: createId("rev"),
      ...payload,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ review });
  }
}
