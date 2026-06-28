import { query } from "../config/database";
import { StoredReview } from "./database.model";

type ReviewRow = {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: Date;
};

function mapReview(row: ReviewRow): StoredReview {
  return {
    id: row.id,
    reviewerName: row.reviewer_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
  };
}

export class ReviewModel {
  static async findMany() {
    const result = await query<ReviewRow>(
      `SELECT id, reviewer_name, rating, comment, created_at
       FROM app_reviews
       ORDER BY created_at DESC
       LIMIT 50`,
    );

    return result.rows.map(mapReview);
  }

  static async count() {
    const result = await query<{ count: string }>("SELECT COUNT(*) AS count FROM app_reviews");
    return Number(result.rows[0]?.count ?? 0);
  }

  static async create(review: StoredReview) {
    const result = await query<ReviewRow>(
      `INSERT INTO app_reviews (id, reviewer_name, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, reviewer_name, rating, comment, created_at`,
      [review.id, review.reviewerName, review.rating, review.comment, review.createdAt],
    );

    const createdReview = result.rows[0];
    if (!createdReview) return review;

    return mapReview(createdReview);
  }

  static async createMany(reviews: StoredReview[]) {
    if (reviews.length === 0) return;

    for (const review of reviews) {
      await this.create(review);
    }
  }
}
