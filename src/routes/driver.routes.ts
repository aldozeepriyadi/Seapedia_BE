import { Router } from "express";
import { Role } from "../constants/roles";
import { DriverController } from "../controllers/driver.controller";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, requireActiveRole } from "../middleware/auth.middleware";

export const driverRoutes = Router();

driverRoutes.use(authenticate, requireActiveRole(Role.DRIVER));

driverRoutes.get("/jobs/available", asyncHandler(DriverController.availableJobs));
driverRoutes.get("/jobs/active", asyncHandler(DriverController.activeJob));
driverRoutes.get("/jobs/history", asyncHandler(DriverController.jobHistory));
driverRoutes.get("/jobs/:id", asyncHandler(DriverController.showJob));
driverRoutes.post("/jobs/:id/take", asyncHandler(DriverController.takeJob));
driverRoutes.post("/jobs/:id/complete", asyncHandler(DriverController.completeJob));
driverRoutes.get("/reports/summary", asyncHandler(DriverController.report));
