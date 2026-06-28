"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const review_model_1 = require("../models/review.model");
const id_service_1 = require("../services/id.service");
const review_validator_1 = require("../validators/review.validator");
class ReviewController {
    static async index(_req, res) {
        const reviews = await review_model_1.ReviewModel.findMany();
        res.json({ reviews });
    }
    static async store(req, res) {
        const payload = review_validator_1.reviewSchema.parse(req.body);
        const review = await review_model_1.ReviewModel.create({
            id: (0, id_service_1.createId)("rev"),
            ...payload,
            createdAt: new Date().toISOString(),
        });
        res.status(201).json({ review });
    }
}
exports.ReviewController = ReviewController;
