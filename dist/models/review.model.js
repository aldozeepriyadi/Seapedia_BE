"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const database_1 = require("../config/database");
function mapReview(row) {
    return {
        id: row.id,
        reviewerName: row.reviewer_name,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at.toISOString(),
    };
}
class ReviewModel {
    static async findMany() {
        const result = await (0, database_1.query)(`SELECT id, reviewer_name, rating, comment, created_at
       FROM app_reviews
       ORDER BY created_at DESC
       LIMIT 50`);
        return result.rows.map(mapReview);
    }
    static async count() {
        const result = await (0, database_1.query)("SELECT COUNT(*) AS count FROM app_reviews");
        return Number(result.rows[0]?.count ?? 0);
    }
    static async create(review) {
        const result = await (0, database_1.query)(`INSERT INTO app_reviews (id, reviewer_name, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, reviewer_name, rating, comment, created_at`, [review.id, review.reviewerName, review.rating, review.comment, review.createdAt]);
        const createdReview = result.rows[0];
        if (!createdReview)
            return review;
        return mapReview(createdReview);
    }
    static async createMany(reviews) {
        if (reviews.length === 0)
            return;
        for (const review of reviews) {
            await this.create(review);
        }
    }
}
exports.ReviewModel = ReviewModel;
