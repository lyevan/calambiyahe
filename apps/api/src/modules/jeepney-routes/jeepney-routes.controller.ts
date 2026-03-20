import { Request, Response } from "express";
import { routesService } from "./jeepney-routes.service";
import {
  createRouteSchema,
  updateRouteSchema,
  bulkWaypointsSchema,
  waypointSchema,
} from "./jeepney-routes.validation";

type ControllerError = Error & { statusCode?: number };

export const routesController = {
  async createRoute(req: Request, res: Response) {
    try {
      const validatedData = createRouteSchema.parse(req.body);
      const route = await routesService.createRoute(
        validatedData,
        req.user!.user_id,
      );
      res.status(201).json({ success: true, data: route });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async getAllRoutes(req: Request, res: Response) {
    try {
      const onlyActive = req.query.all !== "true";
      const routes = await routesService.listRoutes(onlyActive);
      res.json({ success: true, data: routes });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 500)
        .json({ success: false, error: typedError.message });
    }
  },

  async getRouteById(req: Request, res: Response) {
    try {
      const route = await routesService.getRouteDetail(req.params.id);
      res.json({ success: true, data: route });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 404)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateRoute(req: Request, res: Response) {
    try {
      const validatedData = updateRouteSchema.parse(req.body);
      const route = await routesService.updateRoute(
        req.params.id,
        validatedData,
      );
      res.json({ success: true, data: route });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async deleteRoute(req: Request, res: Response) {
    try {
      await routesService.deleteRoute(req.params.id);
      res.json({ success: true, message: "Route deleted successfully" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async addWaypoint(req: Request, res: Response) {
    try {
      const validatedData = waypointSchema.parse(req.body);
      const waypoint = await routesService.addWaypoint(
        req.params.id,
        validatedData,
      );
      res
        .status(201)
        .json({ success: true, data: waypoint, message: "Waypoint added" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateWaypoints(req: Request, res: Response) {
    try {
      const validatedData = bulkWaypointsSchema.parse(req.body);
      const waypoints = await routesService.bulkUpdateWaypoints(
        req.params.id,
        validatedData,
      );
      res.json({
        success: true,
        data: waypoints,
        message: "Waypoints updated",
      });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async deleteWaypoint(req: Request, res: Response) {
    try {
      const waypoints = await routesService.deleteWaypoint(
        req.params.id,
        req.params.wid,
      );
      res.json({ success: true, data: waypoints, message: "Waypoint deleted" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },
};
