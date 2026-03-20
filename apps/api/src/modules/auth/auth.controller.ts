import { Request, Response } from "express";
import { authService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validation";

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await authService.register(validatedData);
      res.status(201).json({ success: true, data: user, message: "User registered successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, token } = await authService.login(validatedData);
      
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
      res.json({ success: true, data: { user, token }, message: "Login successful" });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  },
};
