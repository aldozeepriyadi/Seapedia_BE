import { Router } from "express";
import { Role } from "../constants/roles";
import { AdminController } from "../controllers/admin.controller";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, requireActiveRole } from "../middleware/auth.middleware";

export const adminRoutes = Router();

adminRoutes.use(authenticate, requireActiveRole(Role.ADMIN));
adminRoutes.get("/monitoring", asyncHandler(AdminController.monitoring));
adminRoutes.post("/overdue/run", asyncHandler(AdminController.runOverdue));
adminRoutes.get("/vouchers", asyncHandler(AdminController.listVouchers));
adminRoutes.post("/vouchers", asyncHandler(AdminController.createVoucher));
adminRoutes.get("/vouchers/:id", asyncHandler(AdminController.showVoucher));
adminRoutes.get("/promos", asyncHandler(AdminController.listPromos));
adminRoutes.post("/promos", asyncHandler(AdminController.createPromo));
adminRoutes.get("/promos/:id", asyncHandler(AdminController.showPromo));
