import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { adminRoutes } from "./admin.routes";
import { authRoutes } from "./auth.routes";
import { buyerRoutes } from "./buyer.routes";
import { driverRoutes } from "./driver.routes";
import { productRoutes } from "./product.routes";
import { reviewRoutes } from "./review.routes";
import { sellerRoutes } from "./seller.routes";

export const apiRoutes = Router();

apiRoutes.get("/health", HealthController.show);
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/buyer", buyerRoutes);
apiRoutes.use("/driver", driverRoutes);
apiRoutes.use("/products", productRoutes);
apiRoutes.use("/reviews", reviewRoutes);
apiRoutes.use("/seller", sellerRoutes);
