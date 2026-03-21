import { Router } from 'express';
import { aiController } from './ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

// ─── AI Routes ────────────────────────────────────────────────────────────────
// Base path: /api/v1/ai  (registered in main app router)
// All routes require a valid JWT via authMiddleware.

const router = Router();

/**
 * POST /api/v1/ai/reroute
 * Roles: driver, private_driver
 * Returns an AI-generated rerouting suggestion for a flagged hazard zone.
 */
router.post('/reroute', authMiddleware, aiController.reroute);

/**
 * POST /api/v1/ai/travel-tips
 * Roles: commuter, guide, citizen
 * Returns AI-generated travel tips for a Calamba City destination.
 */
router.post('/travel-tips', authMiddleware, aiController.travelTips);

/**
 * POST /api/v1/ai/analyze-hazard
 * Roles: citizen, commuter, driver
 * Sends a base64 road photo to Gemini Vision for hazard classification.
 * Call this before/after the hazards module stores the photo.
 */
router.post('/analyze-hazard', authMiddleware, aiController.analyzeHazard);

export default router;
