import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import prisma from "./client";
import logger from "../utils/logger";

async function cleanupExpiredGuests() {
  try {
    const currDate = new Date();

    const result = await prisma.user.deleteMany({
      where: {
        role: "GUEST",
        expiresAt: {
          lt: currDate,
        },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired guest users`);
    }
  } catch (error) {
    logger.error("Failed to cleanup expired guests", error);
  }
}

export { cleanupExpiredGuests };
