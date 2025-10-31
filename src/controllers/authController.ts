import { Request, Response } from "express";
import authService from "../services/authService";
import logger from "../utils/logger";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const authResponse = await authService.register(email, password, name);
    res.json(authResponse);
  } catch (error) {
    console.error("Registration Failed", error);
    logger.error("Registration failed", error);
    if (error instanceof Error && /already exists/i.test(error.message)) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const authResponse = await authService.login(email, password);
    if (authResponse) {
      res.json(authResponse);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login failed", error);
    logger.error("Login failed", error);
    if (error instanceof Error && error.message) {
      return res.status(500).json({ error: error.message });
    }
    res.status(500).json({ error: "Login failed" });
  }
};

export const guestLogin = async (req: Request, res: Response) => {
  try {
    const authResponse = await authService.guestLogin();
    res.json({
      ...authResponse,
      message: "Guest access granted (limited)",
    });
  } catch (error) {
    console.error("Guest login failed", error);
    logger.error("Guest login failed", error);
    if (error instanceof Error && error.message) {
      return res.status(500).json({ error: error.message });
    }
    res.status(500).json({ error: "Guest login failed" });
  }
};

export const googleCallback = (req: Request, res: Response) => {
  const user = (req as any).user;
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
};
