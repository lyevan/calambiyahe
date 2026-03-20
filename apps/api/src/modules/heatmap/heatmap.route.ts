import { Router } from "express";
import { heatmapController } from "./heatmap.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/:route_id", authMiddleware, heatmapController.getHeatmap);

export default router;
