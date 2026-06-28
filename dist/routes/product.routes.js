"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const async_handler_1 = require("../middleware/async-handler");
exports.productRoutes = (0, express_1.Router)();
exports.productRoutes.get("/", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.index));
exports.productRoutes.get("/:id", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.show));
