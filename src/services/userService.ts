import prisma from "../prisma/client";
import { Role } from "@prisma/client";
import logger from "../utils/logger";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  profilePictureUrl: string | null;
  role: Role;
  isPremium: boolean;
  premiumUntil: Date | null;
  createdAt: Date;
}

export class UserService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          profilePictureUrl: true,
          role: true,
          isPremium: true,
          premiumUntil: true,
          createdAt: true,
        },
      });
      return user;
    } catch (error) {
      logger.error("Error fetching user profile", error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    data: {
      name?: string;
      profilePictureUrl?: string;
    }
  ): Promise<UserProfile> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.profilePictureUrl !== undefined) {
        updateData.profilePictureUrl = data.profilePictureUrl;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          profilePictureUrl: true,
          role: true,
          isPremium: true,
          premiumUntil: true,
          createdAt: true,
        },
      });

      logger.info("User profile updated", { userId });
      return updatedUser;
    } catch (error) {
      logger.error("Error updating user profile", error);
      throw error;
    }
  }
}

export default new UserService();
