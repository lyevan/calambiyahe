import { Router } from "express";
import { aiController } from "./ai.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middleware/auth.middleware";

// ─── AI Routes ────────────────────────────────────────────────────────────────
// Base path: /api/v1/ai  (registered in main app router)
// All routes require a valid JWT via authMiddleware.

const router = Router();

/**
 * POST /api/v1/ai/reroute
 * Roles: driver, private_driver
 * Returns an AI-generated rerouting suggestion for a flagged hazard zone.
 */
router.post(
  "/reroute",
  authMiddleware,
  authorizeRoles("driver", "private_driver"),
  aiController.reroute,
);

/**
 * POST /api/v1/ai/travel-tips
 * Roles: commuter, guide, citizen
 * Returns AI-generated travel tips for a Calamba City destination.
 */
router.post(
  "/travel-tips",
  authMiddleware,
  authorizeRoles("commuter", "guide", "citizen", "driver", "private_driver"),
  aiController.travelTips,
);

/**
 * POST /api/v1/ai/analyze-hazard
 * Roles: citizen, commuter, driver
 * Sends a base64 road photo to Gemini Vision for hazard classification.
 * Call this before/after the hazards module stores the photo.
 * Useful for map popover when user clicks the hazard.
 * Call this also before admin confirms the hazard.
 */
router.post(
  "/analyze-hazard",
  authMiddleware,
  authorizeRoles("citizen", "commuter", "driver", "private_driver", "admin"),
  aiController.analyzeHazard,
);

/**
 * POST /api/v1/ai/route
 * Roles: driver, private_driver
 * Returns an AI-refined route geometry + ETA considering active hazards.
 */
router.post(
  "/route",
  authMiddleware,
  authorizeRoles("driver", "private_driver"),
  aiController.route,
);

export default router;
