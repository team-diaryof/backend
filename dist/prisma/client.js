"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient({
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
    logger_1.default.error("Prisma error", e);
});
async function connect() {
    try {
        await prisma.$connect();
        logger_1.default.info("Connected to PostgreSQL database");
    }
    catch (error) {
        logger_1.default.error("Failed to connect to PostgreSQL database", error);
        process.exit(1);
    }
}
connect();
exports.default = prisma;
