import { Router } from "express";
import { usersController } from "./users.controller";
import {
  authMiddleware,
  adminMiddleware,
} from "../../middleware/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, usersController.getMyProfile);
router.patch("/me", authMiddleware, usersController.updateMyProfile);
router.patch("/me/role", authMiddleware, usersController.updateMyRole);

router.get("/", authMiddleware, adminMiddleware, usersController.listUsers);
router.patch(
  "/:user_id/role",
  authMiddleware,
  adminMiddleware,
  usersController.updateUserRole,
);

export default router;
