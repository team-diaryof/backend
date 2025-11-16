import { Request, Response } from "express";
import userService from "../services/userService";
import logger from "../utils/logger";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Multer error handler middleware
const handleMulterError = (err: any, req: any, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum size is 5MB" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}. Expected field name: 'profilePicture'`,
      });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

/**
 * Get user profile
 * GET /api/v1/user/profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const userProfile = await userService.getUserProfile(user.id);

    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile retrieved successfully",
      user: userProfile,
    });
  } catch (error) {
    logger.error("Get profile error", error);
    const message =
      error instanceof Error ? error.message : "Failed to get profile";
    res.status(500).json({ error: message });
  }
};

/**
 * Update user profile
 * PUT /api/v1/user/updateProfile
 * Body: { name?: string, profilePictureUrl?: string }
 * OR multipart/form-data with file upload
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { name } = req.body;

    let profilePictureUrl: string | undefined = undefined;

    // Handle file upload if present
    if (req.file) {
      try {
        // Get current user to check for existing profile picture
        const currentUser = await userService.getUserProfile(user.id);

        // Delete old profile picture if exists
        if (currentUser?.profilePictureUrl) {
          await deleteFromCloudinary(currentUser.profilePictureUrl);
        }

        // Upload new profile picture
        profilePictureUrl = await uploadToCloudinary(
          req.file.buffer,
          "diary-backend/profile-pictures",
          `user-${user.id}`
        );
      } catch (uploadError) {
        logger.error("Profile picture upload error", uploadError);
        return res.status(400).json({
          error: "Failed to upload profile picture",
        });
      }
    } else if (req.body.profilePictureUrl) {
      // Allow direct URL update (e.g., from frontend that already uploaded)
      profilePictureUrl = req.body.profilePictureUrl;
    }

    // Update profile
    const updateData: { name?: string; profilePictureUrl?: string } = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = profilePictureUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    const updatedUser = await userService.updateUserProfile(
      user.id,
      updateData
    );

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Update profile error", error);
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    res.status(500).json({ error: message });
  }
};

// Export multer middleware for use in routes
// This middleware will only process multipart/form-data requests
// JSON requests will pass through without file processing
export const uploadProfilePicture = (req: any, res: Response, next: any) => {
  // Check if request is multipart/form-data
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    // Use multer to handle file upload
    upload.single("profilePicture")(req, res, (err: any) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  } else {
    // For JSON requests, skip multer and proceed
    next();
  }
};
