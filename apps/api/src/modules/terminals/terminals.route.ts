import { Router } from "express";
import { terminalsController } from "./terminals.controller";
import {
  authMiddleware,
  adminMiddleware,
} from "../../middleware/auth.middleware";

const router = Router();

router.get("/", terminalsController.listTerminals);
router.get("/:terminal_id", terminalsController.getTerminalDetail);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
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
  adminMiddleware,
  terminalsController.createWaitingSpot,
);
router.delete(
  "/spots/:spot_id",
  authMiddleware,
  adminMiddleware,
  terminalsController.deleteWaitingSpot,
);

export default router;
