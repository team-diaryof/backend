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
});

prisma.$on("error", (e) => {
  logger.error("Prisma error", e);
});

async function connect() {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL database");
  } catch (error) {
    logger.error("Failed to connect to PostgreSQL database", error);
    process.exit(1);
  }
}

connect();

export default prisma;
