import { Request, Response } from "express";
import authService from "../services/authService";
import logger from "../utils/logger";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body as {
    email: string;
    password: string;
    name?: string;
  };

  try {
    const { message } = await authService.sendRegistrationOtp(
      email,
      password,
      name
    );
    res.json({ message });
  } catch (error) {
    console.error("Send OTP failed", error);
    logger.error("Send OTP failed", error);
    if (error instanceof Error && /already exists/i.test(error.message)) {
      return res.status(409).json({ error: error.message });
    }
    const message =
      error instanceof Error ? error.message : "Failed to send OTP";
    res.status(400).json({ error: message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body as {
    email: string;
    otp: string;
  };

  try {
    const authResponse = await authService.verifyOtpAndRegister(email, otp);
    res.json(authResponse);
  } catch (error) {
    console.error("OTP verification failed", error);
    logger.error("OTP verification failed", error);
    const message =
      error instanceof Error ? error.message : "Verification failed";
    const status = /exists|Invalid|expired/i.test(message) ? 400 : 500;
    res.status(status).json({ error: message });
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
