import { Request, Response } from "express";
import { hazardsService } from "./hazards.service";
import { createHazardSchema, updateHazardSchema, potholeZoneSchema } from "./hazards.validation";

export const hazardsController = {
  async reportHazard(req: Request, res: Response) {
    try {
      const validatedData = createHazardSchema.parse(req.body);
      
      // Handle image upload if present
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      const report = await hazardsService.reportHazard(req.user!.user_id, {
        ...validatedData,
        image_url: imageUrl,
      });
      
      res.status(201).json({ success: true, data: report });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async getHazards(req: Request, res: Response) {
    try {
      const hazards = await hazardsService.listHazards();
      res.json({ success: true, data: hazards });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const validatedData = updateHazardSchema.parse(req.body);
      const report = await hazardsService.updateStatus(req.params.id, validatedData.status!);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async addPotholeZone(req: Request, res: Response) {
    try {
      const validatedData = potholeZoneSchema.parse(req.body);
      const zone = await hazardsService.addPotholeZone(req.params.id, validatedData);
      res.status(201).json({ success: true, data: zone });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async getPotholeZones(req: Request, res: Response) {
    try {
      const zones = await hazardsService.listPotholeZones();
      res.json({ success: true, data: zones });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
