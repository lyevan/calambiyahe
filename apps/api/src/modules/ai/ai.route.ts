import { Router } from "express";
import { aiController } from "./ai.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/reroute-suggest", authMiddleware, aiController.rerouteSuggest);
router.post("/travel-tips", authMiddleware, aiController.travelTips);

export default router;
