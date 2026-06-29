import { Router } from "express";
import { Role } from "../constants/roles";
import { SellerController } from "../controllers/seller.controller";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, requireActiveRole } from "../middleware/auth.middleware";

export const sellerRoutes = Router();

sellerRoutes.use(authenticate, requireActiveRole(Role.SELLER));

sellerRoutes.get("/store", asyncHandler(SellerController.getStore));
sellerRoutes.post("/store", asyncHandler(SellerController.saveStore));
sellerRoutes.put("/store", asyncHandler(SellerController.saveStore));
sellerRoutes.get("/products", asyncHandler(SellerController.getProducts));
sellerRoutes.post("/products", asyncHandler(SellerController.createProduct));
sellerRoutes.put("/products/:id", asyncHandler(SellerController.updateProduct));
sellerRoutes.delete("/products/:id", asyncHandler(SellerController.deleteProduct));
sellerRoutes.get("/orders", asyncHandler(SellerController.getOrders));
