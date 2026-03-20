import { Router } from "express";
import multer from "multer";
import path from "path";
import { hazardsController } from "./hazards.controller";
import { authMiddleware, adminMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Public routes
router.get("/", hazardsController.getHazards);
router.get("/potholes", hazardsController.getPotholeZones);

// Authenticated routes
router.post("/", authMiddleware, upload.single("image"), hazardsController.reportHazard);

// Admin routes
router.patch("/:id/status", authMiddleware, adminMiddleware, hazardsController.updateStatus);
router.post("/:id/zone", authMiddleware, adminMiddleware, hazardsController.addPotholeZone);

export default router;
