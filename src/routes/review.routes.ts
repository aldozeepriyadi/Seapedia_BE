import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { asyncHandler } from "../middleware/async-handler";

export const reviewRoutes = Router();

reviewRoutes.get("/", asyncHandler(ReviewController.index));
reviewRoutes.post("/", asyncHandler(ReviewController.store));
