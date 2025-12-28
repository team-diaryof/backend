import { Request, Response } from "express";
import { findOrCreateDayForUser, getDaysForUser, getDayById } from "../services/dayService";

export const createDayHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { date } = req.body;
    const d = date ? new Date(date) : undefined;
    const day = await findOrCreateDayForUser(user.id, d);
    res.status(201).json(day);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create day" });
  }
};

export const getDaysHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const perPage = req.query.perPage ? parseInt(String(req.query.perPage), 10) : 50;

    const days = await getDaysForUser(user.id, page, perPage);
    res.json({ days });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch days" });
  }
};

export const getDayHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { id } = req.params;
    const day = await getDayById(user.id, id);
    res.json(day);
  } catch (error: any) {
    if (error.message === "Day not found") return res.status(404).json({ error: error.message });
    if (error.message.includes("Not authorized")) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: "Failed to fetch day" });
  }
};