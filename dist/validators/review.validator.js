"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSchema = void 0;
const zod_1 = require("zod");
exports.reviewSchema = zod_1.z.object({
    reviewerName: zod_1.z.string().trim().min(2).max(60),
    rating: zod_1.z.coerce.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().min(4).max(500),
});
