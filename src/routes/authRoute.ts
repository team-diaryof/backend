import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { Role } from "@prisma/client";
import {
  guestLogin,
  login,
  register,
  googleCallback,
} from "../controllers/authController";
import {
  requireRole,
  requirePermission,
  authenticate,
} from "../middlewares/authMiddleware";
// env no longer needed here after moving google callback logic to controller

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 6000,
  max: 500,
  message: "Too many login attempts, please try again later.",
});

// Authentication routes
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/guest", authLimiter, guestLogin);

// Google OAuth routes
router.get("/google", passport.authenticate("google"));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleCallback
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
