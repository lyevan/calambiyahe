import { Request, Response } from "express";
import { terminalsService } from "./terminals.service";
import {
  createTerminalSchema,
  updateTerminalSchema,
  createWaitingSpotSchema,
  updateStatusSchema,
} from "./terminals.validation";

type ControllerError = Error & { statusCode?: number };

export const terminalsController = {
  async createTerminal(req: Request, res: Response) {
    try {
      const validatedPayload = createTerminalSchema.parse(req.body);
      const terminal = await terminalsService.createTerminal(
        req.user!.user_id,
        validatedPayload,
      );
      res
        .status(201)
        .json({ success: true, data: terminal, message: "Terminal created" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async listTerminals(req: Request, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const terminals = await terminalsService.listTerminals(status);
      res.json({ success: true, data: terminals });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async getTerminalDetail(req: Request, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const terminal = await terminalsService.getTerminalDetail(
        req.params.terminal_id,
        status,
      );
      res.json({ success: true, data: terminal });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateTerminal(req: Request, res: Response) {
    try {
      const validatedPayload = updateTerminalSchema.parse(req.body);
      const terminal = await terminalsService.updateTerminal(
        req.params.terminal_id,
        validatedPayload,
      );
      res.json({ success: true, data: terminal, message: "Terminal updated" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async deleteTerminal(req: Request, res: Response) {
    try {
      await terminalsService.deleteTerminal(req.params.terminal_id);
      res.json({ success: true, message: "Terminal deleted" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async createWaitingSpot(req: Request, res: Response) {
    try {
      const validatedPayload = createWaitingSpotSchema.parse(req.body);
      const spot = await terminalsService.createWaitingSpot(
        req.params.terminal_id,
        validatedPayload,
      );
      res
        .status(201)
        .json({ success: true, data: spot, message: "Waiting spot created" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async deleteWaitingSpot(req: Request, res: Response) {
    try {
      await terminalsService.deleteWaitingSpot(req.params.spot_id);
      res.json({ success: true, message: "Waiting spot deleted" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateTerminalStatus(req: Request, res: Response) {
    try {
      const validatedPayload = updateStatusSchema.parse(req.body);
      const terminal = await terminalsService.updateTerminalStatus(
        req.params.terminal_id,
        validatedPayload.status,
      );
      res.json({ success: true, data: terminal, message: "Terminal status updated" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateWaitingSpotStatus(req: Request, res: Response) {
    try {
      const validatedPayload = updateStatusSchema.parse(req.body);
      const spot = await terminalsService.updateWaitingSpotStatus(
        req.params.spot_id,
        validatedPayload.status,
      );
      res.json({ success: true, data: spot, message: "Waiting spot status updated" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async listAllWaitingSpots(req: Request, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const spots = await terminalsService.getAllWaitingSpots(status);
      res.json({ success: true, data: spots });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },
};
