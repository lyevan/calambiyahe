import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const authService = {
  async register(data: any) {
    if (data.role === "admin") {
      throw new Error("Admin role cannot be selected during registration");
    }

    const existingUser = await authRepository.findUserByUsername(data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await authRepository.createUser({
      ...data,
      password: hashedPassword,
      is_admin: false,
    });

    const { password, ...result } = user;
    return result;
  },

  async login(data: any) {
    const user = await authRepository.findUserByUsername(data.username);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const { password, ...userRecord } = user;
    return { user: userRecord, token };
  },
};
