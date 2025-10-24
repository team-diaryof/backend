"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const env_1 = require("../config/env");
const router = express_1.default.Router();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later.",
});
// Authentication routes
router.post("/register", authLimiter, authController_1.register);
router.post("/login", authLimiter, authController_1.login);
router.post("/guest", authLimiter, authController_1.guestLogin);
// Google OAuth routes
router.get("/auth/google", passport_1.default.authenticate("google"));
router.get("/auth/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
    const user = req.user;
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, env_1.env.JWT_SECRET, {
        expiresIn: "1h",
    });
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        },
    });
});
// Protected routes
router.get("/private", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)([client_1.Role.USER, client_1.Role.ADMIN]), (req, res) => {
    res.json({ message: "Private route accessed" });
});
router.get("/content", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("readContent"), (req, res) => {
    res.json({ message: "Content read access granted" });
});
router.get("/users", authMiddleware_1.authenticate, (0, authMiddleware_1.requirePermission)("manageUsers"), (req, res) => {
    res.json({ message: "User management access granted" });
});
exports.default = router;
