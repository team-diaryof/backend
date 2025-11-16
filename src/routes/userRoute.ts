import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
} from "../controllers/userController";

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get user profile
router.get("/profile", getProfile);

// Update user profile (supports both JSON and multipart/form-data)
router.put("/updateProfile", uploadProfilePicture, updateProfile);

export default router;
