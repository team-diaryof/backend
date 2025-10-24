"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const envalid_1 = require("envalid");
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    DATABASE_URL: (0, envalid_1.str)({ desc: "MongoDB Atlas connection string" }),
    PORT: (0, envalid_1.port)({ default: 8080 }),
    JWT_SECRET: (0, envalid_1.str)(),
    GOOGLE_CLIENT_ID: (0, envalid_1.str)(),
    GOOGLE_CLIENT_SECRET: (0, envalid_1.str)(),
    SESSION_SECRET: (0, envalid_1.str)(),
    BASE_URL: (0, envalid_1.str)({
        default: "http://localhost:8080",
        desc: "Base URL for OAuth callbacks",
    }),
});
