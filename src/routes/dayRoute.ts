import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { createDayHandler, getDaysHandler, getDayHandler } from "../controllers/dayController";

const router = express.Router();

router.get("/", authenticate, getDaysHandler);
router.post("/", authenticate, createDayHandler);
router.get("/:id", authenticate, getDayHandler);

export default router;