import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import { MongoClient } from "mongodb";
import { env } from "../config/env";
import logger from "../utils/logger";

async function setupTTLIndex() {
  const client = new MongoClient(env.DATABASE_URL);

  try {
    await client.connect();
    const db = client.db();
    await db
      .collection("users")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    logger.info("TTL index created on users.expired");
  } catch (error) {
    logger.error("Failed to create TTL index", error);
  } finally {
    await client.close();
  }
}

setupTTLIndex().catch((error) => logger.error(error));
