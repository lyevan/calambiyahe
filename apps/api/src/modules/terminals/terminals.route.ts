import { Router } from "express";
import { terminalsController } from "./terminals.controller";
import {
  authMiddleware,
  adminMiddleware,
} from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/all-spots",
  authMiddleware,
  adminMiddleware,
  terminalsController.listAllWaitingSpots,
);

router.get("/", terminalsController.listTerminals);
router.get("/:terminal_id", terminalsController.getTerminalDetail);

router.post(
  "/",
  authMiddleware,

  terminalsController.createTerminal,
);
router.patch(
  "/:terminal_id",
  authMiddleware,
  adminMiddleware,
  terminalsController.updateTerminal,
);
router.delete(
  "/:terminal_id",
  authMiddleware,
  adminMiddleware,
  terminalsController.deleteTerminal,
);

router.post(
  "/:terminal_id/spots",
  authMiddleware,

  terminalsController.createWaitingSpot,
);
router.delete(
  "/spots/:spot_id",
  authMiddleware,
  adminMiddleware,
  terminalsController.deleteWaitingSpot,
);

router.patch(
  "/:terminal_id/status",
  authMiddleware,
  adminMiddleware,
  terminalsController.updateTerminalStatus,
);

router.patch(
  "/spots/:spot_id/status",
  authMiddleware,
  adminMiddleware,
  terminalsController.updateWaitingSpotStatus,
);

export default router;
