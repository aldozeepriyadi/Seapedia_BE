import { Router } from "express";
import { Role } from "../constants/roles";
import { BuyerController } from "../controllers/buyer.controller";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, requireActiveRole } from "../middleware/auth.middleware";

export const buyerRoutes = Router();

buyerRoutes.use(authenticate, requireActiveRole(Role.BUYER));
buyerRoutes.get("/wallet", asyncHandler(BuyerController.wallet));
buyerRoutes.post("/wallet/top-up", asyncHandler(BuyerController.topUp));
buyerRoutes.get("/addresses", asyncHandler(BuyerController.addresses));
buyerRoutes.post("/addresses", asyncHandler(BuyerController.createAddress));
buyerRoutes.get("/cart", asyncHandler(BuyerController.cart));
buyerRoutes.post("/cart/items", asyncHandler(BuyerController.addCartItem));
buyerRoutes.put("/cart/items/:productId", asyncHandler(BuyerController.updateCartItem));
buyerRoutes.delete("/cart/items/:productId", asyncHandler(BuyerController.removeCartItem));
buyerRoutes.delete("/cart", asyncHandler(BuyerController.clearCart));
buyerRoutes.post("/checkout/preview", asyncHandler(BuyerController.checkoutPreview));
buyerRoutes.post("/checkout", asyncHandler(BuyerController.checkout));
buyerRoutes.get("/reports/summary", asyncHandler(BuyerController.report));
buyerRoutes.get("/orders", asyncHandler(BuyerController.orders));
buyerRoutes.get("/orders/:id", asyncHandler(BuyerController.orderDetail));
