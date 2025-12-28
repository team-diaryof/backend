import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { createTaskHandler, getTasksHandler, updateTaskHandler, deleteTaskHandler } from "../controllers/taskController";

const router = express.Router();

// Get tasks (optional query: dayId, page, perPage)
router.get("/", authenticate, getTasksHandler);

// Create a task for a day
router.post("/", authenticate, createTaskHandler);

// Update a task
router.put("/:id", authenticate, updateTaskHandler);

// Delete a task
router.delete("/:id", authenticate, deleteTaskHandler);

export default router;
