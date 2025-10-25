import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import prisma from "./client";
import logger from "../utils/logger";

async function cleanupExpiredGuests() {
  try {
    const result = await prisma.user.deleteMany({
      where: {
        role: "GUEST",
        expiresAt: {
          lt: new Date(),
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

// Run cleanup immediately
cleanupExpiredGuests().catch((error) => logger.error(error));

export { cleanupExpiredGuests };
