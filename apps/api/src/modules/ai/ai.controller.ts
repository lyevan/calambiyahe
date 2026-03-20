import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import {
  rerouteSchema,
  travelTipsSchema,
  hazardAnalysisSchema,
} from './ai.validation';

// ─── AI Controller ────────────────────────────────────────────────────────────

export const aiController = {
  /**
   * POST /api/v1/ai/reroute
   * Requires auth. Body: RerouteInput
   */
  async reroute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = rerouteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: parsed.error.errors[0]?.message ?? 'Invalid request body',
        });
        return;
      }

      const suggestion = await aiService.getRerouteSuggestion(parsed.data);

      res.status(200).json({
        success: true,
        data: suggestion,
        message: 'Reroute suggestion generated',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/ai/travel-tips
   * Requires auth. Body: TravelTipsInput
   */
  async travelTips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = travelTipsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: parsed.error.errors[0]?.message ?? 'Invalid request body',
        });
        return;
      }

      const tips = await aiService.getTravelTips(parsed.data);

      res.status(200).json({
        success: true,
        data: tips,
        message: 'Travel tips generated',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/ai/analyze-hazard
   * Requires auth. Body: HazardAnalysisInput
   * Note: imageBase64 should be sent as a JSON string field (not multipart).
   * The hazards module handles actual file storage via multer separately.
   */
  async analyzeHazard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = hazardAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: parsed.error.errors[0]?.message ?? 'Invalid request body',
        });
        return;
      }

      const analysis = await aiService.analyzeHazardPhoto(parsed.data);

      res.status(200).json({
        success: true,
        data: analysis,
        message: 'Hazard analysis complete',
      });
    } catch (err) {
      next(err);
    }
  },
};
