import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { authRoutes } from "./auth.routes";
import { buyerRoutes } from "./buyer.routes";
import { productRoutes } from "./product.routes";
import { reviewRoutes } from "./review.routes";
import { sellerRoutes } from "./seller.routes";

export const apiRoutes = Router();

apiRoutes.get("/health", HealthController.show);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/buyer", buyerRoutes);
apiRoutes.use("/products", productRoutes);
apiRoutes.use("/reviews", reviewRoutes);
apiRoutes.use("/seller", sellerRoutes);
