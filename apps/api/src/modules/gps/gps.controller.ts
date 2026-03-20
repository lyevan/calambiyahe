import { Request, Response } from "express";
import { gpsService } from "./gps.service";
import { gpsBroadcastSchema, driverRouteSchema } from "./gps.validation";

type ControllerError = Error & { statusCode?: number };

export const gpsController = {
  async broadcast(req: Request, res: Response) {
    try {
      const validatedData = gpsBroadcastSchema.parse(req.body);
      const signal = await gpsService.broadcastSignal(
        req.user!.user_id,
        req.user!.role,
        validatedData,
      );
      res.status(201).json({ success: true, data: signal });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async getSignalsByRoute(req: Request, res: Response) {
    try {
      const signals = await gpsService.getSignalsByRoute(req.params.route_id);
      res.json({ success: true, data: signals });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async deleteSignal(req: Request, res: Response) {
    try {
      await gpsService.invalidateSignal(req.params.signal_id);
      res.json({ success: true, message: "Signal removed" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async startDriverRoute(req: Request, res: Response) {
    try {
      const validatedData = driverRouteSchema.parse(req.body);
      const session = await gpsService.startDriverRoute(
        req.user!.user_id,
        req.user!.role,
        validatedData.route_id,
      );
      res
        .status(201)
        .json({
          success: true,
          data: session,
          message: "Driver route session started",
        });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async endDriverRoute(req: Request, res: Response) {
    try {
      const endedSession = await gpsService.endDriverRoute(
        req.user!.user_id,
        req.user!.role,
      );
      res.json({
        success: true,
        data: endedSession,
        message: "Driver route session ended",
      });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async getActiveDriverRoute(req: Request, res: Response) {
    try {
      const session = await gpsService.getActiveDriverRoute(
        req.user!.user_id,
        req.user!.role,
      );
      res.json({ success: true, data: session });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },
};
