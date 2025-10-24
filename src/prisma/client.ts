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

async function connect() {
  try {
    await prisma.$connect();
    logger.info("Connected to MongoDB Atlas");
  } catch (error) {
    logger.error("Failed to connect to MongoDB Atlas", error);
    process.exit(1);
  }
}

connect();

export default prisma;
