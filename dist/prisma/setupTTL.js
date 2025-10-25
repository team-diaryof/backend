"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredGuests = cleanupExpiredGuests;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const client_1 = __importDefault(require("./client"));
const logger_1 = __importDefault(require("../utils/logger"));
async function cleanupExpiredGuests() {
    try {
        const result = await client_1.default.user.deleteMany({
            where: {
                role: "GUEST",
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        if (result.count > 0) {
            logger_1.default.info(`Cleaned up ${result.count} expired guest users`);
        }
    }
    catch (error) {
        logger_1.default.error("Failed to cleanup expired guests", error);
    }
}
// Run cleanup immediately
cleanupExpiredGuests().catch((error) => logger_1.default.error(error));
