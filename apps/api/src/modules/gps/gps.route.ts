import { Router } from "express";
import { gpsController } from "./gps.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/broadcast", authMiddleware, gpsController.broadcast);
router.get(
  "/signals/:route_id",
  authMiddleware,
  gpsController.getSignalsByRoute,
);
router.delete("/signal/:signal_id", authMiddleware, gpsController.deleteSignal);

router.post(
  "/driver/start-route",
  authMiddleware,
  gpsController.startDriverRoute,
);
router.post("/driver/end-route", authMiddleware, gpsController.endDriverRoute);
router.get(
  "/driver/active-route",
  authMiddleware,
  gpsController.getActiveDriverRoute,
);

export default router;
