import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { authRoutes } from "./auth.routes";
import { productRoutes } from "./product.routes";
import { reviewRoutes } from "./review.routes";

export const apiRoutes = Router();

apiRoutes.get("/health", HealthController.show);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/products", productRoutes);
apiRoutes.use("/reviews", reviewRoutes);
