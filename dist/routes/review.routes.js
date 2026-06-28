"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const async_handler_1 = require("../middleware/async-handler");
exports.reviewRoutes = (0, express_1.Router)();
exports.reviewRoutes.get("/", (0, async_handler_1.asyncHandler)(review_controller_1.ReviewController.index));
exports.reviewRoutes.post("/", (0, async_handler_1.asyncHandler)(review_controller_1.ReviewController.store));
