import { Request, Response } from "express";
import authService from "../services/authService";
import logger from "../utils/logger";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const token = await authService.register(email, password, name);
    res.json(token);
  } catch (error) {
    logger.error("Registration Failed", error);
    res.status(400).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const token = await authService.login(email, password);
    if (token) {
      res.json(token);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    logger.error("Login failed", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const guestLogin = async (req: Request, res: Response) => {
  try {
    const token = await authService.guestLogin();
    res.json({ token, message: "Guest access granted (limited)" });
  } catch (error) {
    logger.error("Guest login failed", error);
    res.status(500).json({ error: "Guest login failed" });
  }
};
