import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient({
  errorFormat: "pretty",
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

prisma.$on("error", (e) => {
  logger.error("Prisma error", e);
});

async function connectWithRetry(retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      logger.info("Connected to MongoDB Atlas");
      return;
    } catch (error) {
      logger.error(`MongoDB Atlas connection attempt ${i + 1} failed`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed to connect to MongoDB Atlas after retries");
}

connectWithRetry().catch((error) => {
  logger.error(error);
  process.exit(1);
});

export default prisma;
