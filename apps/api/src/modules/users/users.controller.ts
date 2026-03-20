import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { usersService } from "./users.service";
import { updateProfileSchema, updateUserRoleSchema } from "./users.validation";

type ControllerError = Error & { statusCode?: number };

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const usersController = {
  async getMyProfile(req: Request, res: Response) {
    try {
      const profile = await usersService.getMyProfile(req.user!.user_id);
      res.json({ success: true, data: profile });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateMyProfile(req: Request, res: Response) {
    try {
      const validatedPayload = updateProfileSchema.parse(req.body);
      const profile = await usersService.updateMyProfile(
        req.user!.user_id,
        validatedPayload,
      );
      res.json({ success: true, data: profile, message: "Profile updated" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateMyRole(req: Request, res: Response) {
    try {
      const validatedPayload = updateUserRoleSchema.parse(req.body);
      const user = await usersService.updateUserRole(
        req.user!.user_id,
        validatedPayload.role,
      );

      const token = jwt.sign(
        { user_id: user.user_id, role: user.role, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      res.json({
        success: true,
        data: { user, token },
        message: "User role updated",
      });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async listUsers(req: Request, res: Response) {
    try {
      const users = await usersService.listUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },

  async updateUserRole(req: Request, res: Response) {
    try {
      const validatedPayload = updateUserRoleSchema.parse(req.body);
      const user = await usersService.updateUserRole(
        req.params.user_id,
        validatedPayload.role,
      );
      res.json({ success: true, data: user, message: "User role updated" });
    } catch (error) {
      const typedError = error as ControllerError;
      res
        .status(typedError.statusCode ?? 400)
        .json({ success: false, error: typedError.message });
    }
  },
};
