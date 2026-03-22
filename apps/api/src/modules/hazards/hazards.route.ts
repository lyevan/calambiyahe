import { Router } from "express";
import multer from "multer";
import path from "path";
import { hazardsController } from "./hazards.controller";
import { authMiddleware, adminMiddleware } from "../../middleware/auth.middleware";

const router = Router();

import { storage } from "../../lib/cloudinary";

const upload = multer({ storage });

// Public routes
router.get("/", hazardsController.getHazards);
router.get("/potholes", hazardsController.getPotholeZones);

// Authenticated routes
router.post("/", authMiddleware, upload.single("image"), hazardsController.reportHazard);

// Admin routes
router.patch("/:id/status", authMiddleware, adminMiddleware, hazardsController.updateStatus);
router.post("/:id/zone", authMiddleware, adminMiddleware, hazardsController.addPotholeZone);
router.delete("/:id", authMiddleware, adminMiddleware, hazardsController.deleteHazard);

export default router;
