import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { asyncHandler } from "../middleware/async-handler";

export const productRoutes = Router();

productRoutes.get("/", asyncHandler(ProductController.index));
productRoutes.get("/:id", asyncHandler(ProductController.show));
