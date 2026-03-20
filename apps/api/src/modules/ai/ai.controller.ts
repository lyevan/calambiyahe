import { Request, Response } from "express";
import { aiService } from "./ai.service";
import { rerouteSuggestSchema, travelTipsSchema } from "./ai.validation";

type ControllerError = Error & { statusCode?: number };

export const aiController = {
  async rerouteSuggest(req: Request, res: Response) {
    try {
      const validatedPayload = rerouteSuggestSchema.parse(req.body);
      const result = await aiService.suggestReroute(
        req.user!.role,
        validatedPayload,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async travelTips(req: Request, res: Response) {
    try {
      const validatedPayload = travelTipsSchema.parse(req.body);
      const result = await aiService.getTravelTips(
        req.user!.role,
        validatedPayload,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },
};
