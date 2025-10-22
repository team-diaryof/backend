import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { guestLogin, login, register } from "../controllers/authController";
import {
  requireRole,
  requirePermission,
  authenticate,
} from "../middlewares/authMiddleware";
import { env } from "../config/env";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
});

// Authentication routes
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/guest", authLimiter, guestLogin);

// Google OAuth routes
router.get("/auth/google", passport.authenticate("google"));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    const user = (req as any).user;
    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  }
);

// Protected routes
router.get(
  "/private",
  authenticate,
  requireRole([Role.USER, Role.ADMIN]),
  (req: Request, res: Response) => {
    res.json({ message: "Private route accessed" });
  }
);

router.get(
  "/content",
  authenticate,
  requirePermission("readContent"),
  (req: Request, res: Response) => {
    res.json({ message: "Content read access granted" });
  }
);

router.get(
  "/users",
  authenticate,
  requirePermission("manageUsers"),
  (req: Request, res: Response) => {
    res.json({ message: "User management access granted" });
  }
);

export default router;
