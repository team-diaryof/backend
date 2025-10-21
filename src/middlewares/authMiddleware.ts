import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";
import { permission } from "process";
import { hasPermission } from "../utils/permissions";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: Role;
    };
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole =
  (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { id: string; role: Role };
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };

export const requirePermission =
  (permission: string) => (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { id: string; role: Role };
    if (!hasPermission(user.role, permission as any)) {
      return res.status(403).json({ error: "Permission denied" });
    }
    next();
  };
