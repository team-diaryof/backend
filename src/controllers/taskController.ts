import { Request, Response } from "express";
import { createTask } from "../services/taskService";

export const createTaskHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { dayId, dayDate, title, description, timestamp } = req.body;

    // Basic validation: require title or description or audio for typed/voice tasks
    if (!title && !description && !req.body.audioUrl) {
      return res
        .status(400)
        .json({ error: "Provide title or description or an audioUrl" });
    }

    const task = await createTask(user.id, {
      dayId,
      dayDate: dayDate ? new Date(dayDate) : undefined,
      title,
      description,
      timestamp: timestamp ? new Date(timestamp) : undefined,
      audioUrl: req.body.audioUrl,
      transcription: req.body.transcription,
    });

    res.status(201).json(task);
  } catch (error: any) {
    if (error.message === "Day not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Not authorized to add tasks to this day") {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create task" });
  }
};

import { getTasks, updateTask, deleteTask } from "../services/taskService";

export const getTasksHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { dayId, page, perPage } = req.query;

    const tasks = await getTasks(user.id, {
      dayId: typeof dayId === "string" ? dayId : undefined,
      page: page ? parseInt(String(page), 10) : undefined,
      perPage: perPage ? parseInt(String(perPage), 10) : undefined,
    });

    res.json({ tasks });
  } catch (error: any) {
    if (error.message === "Day not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const updateTaskHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { id } = req.params;
    const payload: any = {};
    const updatable = ["title", "description", "timestamp", "category", "audioUrl", "transcription", "sentiment"];
    updatable.forEach((k) => {
      if (typeof req.body[k] !== "undefined") {
        payload[k] = k === "timestamp" && req.body[k] ? new Date(req.body[k]) : req.body[k];
      }
    });

    const updated = await updateTask(user.id, id, payload);
    res.json(updated);
  } catch (error: any) {
    if (error.message === "Task not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Not authorized")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTaskHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { id } = req.params;

    await deleteTask(user.id, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === "Task not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Not authorized")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to delete task" });
  }
};