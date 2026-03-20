import { Router } from "express";
import { routesController } from "./jeepney-routes.controller";
import {
  authMiddleware,
  adminMiddleware,
} from "../../middleware/auth.middleware";
import { RateLimiterMemory } from "rate-limiter-flexible";

const publicRouter = Router();
const adminRouter = Router();

const adminRouteLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
});

const adminRateLimitMiddleware = async (req: any, res: any, next: any) => {
  try {
    await adminRouteLimiter.consume(req.user.user_id);
    next();
  } catch {
    res
      .status(429)
      .json({ success: false, error: "Too many admin route requests" });
  }
};

// Public routes
publicRouter.get("/", routesController.getAllRoutes);
publicRouter.get("/:id", routesController.getRouteById);

// Admin routes
adminRouter.use(authMiddleware, adminMiddleware, adminRateLimitMiddleware);
adminRouter.post("/", routesController.createRoute);
adminRouter.get("/", routesController.getAllRoutes);
adminRouter.get("/:id", routesController.getRouteById);
adminRouter.patch("/:id", routesController.updateRoute);
adminRouter.delete("/:id", routesController.deleteRoute);

adminRouter.post("/:id/waypoints", routesController.addWaypoint);
adminRouter.put("/:id/waypoints", routesController.updateWaypoints);
adminRouter.delete("/:id/waypoints/:wid", routesController.deleteWaypoint);

export { publicRouter as routePublicRouter, adminRouter as routeAdminRouter };
