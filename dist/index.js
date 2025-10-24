"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const passport_1 = __importDefault(require("passport"));
const logger_1 = __importDefault(require("./utils/logger"));
const authRoute_1 = __importDefault(require("./routes/authRoute"));
require("./passport"); // Import passport configuration
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, express_session_1.default)({
    secret: env_1.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Routes
app.get("/", (req, res) => {
    res.send("Server is up and running");
});
app.use("/auth", authRoute_1.default);
app.use((err, req, res, next) => {
    logger_1.default.error(err.message, { stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
