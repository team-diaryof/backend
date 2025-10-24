"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const mongodb_1 = require("mongodb");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
async function setupTTLIndex() {
    const client = new mongodb_1.MongoClient(env_1.env.DATABASE_URL);
    try {
        await client.connect();
        const db = client.db();
        await db
            .collection("users")
            .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        logger_1.default.info("TTL index created on users.expired");
    }
    catch (error) {
        logger_1.default.error("Failed to create TTL index", error);
    }
    finally {
        await client.close();
    }
}
setupTTLIndex().catch((error) => logger_1.default.error(error));
