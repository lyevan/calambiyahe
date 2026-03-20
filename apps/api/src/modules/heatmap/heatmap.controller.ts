import { Request, Response } from "express";
import { heatmapService } from "./heatmap.service";

export const heatmapController = {
  async getHeatmap(req: Request, res: Response) {
    try {
      const heatmap = await heatmapService.getHeatmapForRoute(req.params.route_id);
      res.json({ success: true, data: heatmap });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  },
};
