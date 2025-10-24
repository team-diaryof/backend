"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestLogin = exports.login = exports.register = void 0;
const authService_1 = __importDefault(require("../services/authService"));
const logger_1 = __importDefault(require("../utils/logger"));
const register = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const authResponse = await authService_1.default.register(email, password, name);
        res.json(authResponse);
    }
    catch (error) {
        logger_1.default.error("Registration Failed", error);
        res.status(400).json({ error: "Registration failed" });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const authResponse = await authService_1.default.login(email, password);
        if (authResponse) {
            res.json(authResponse);
        }
        else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    }
    catch (error) {
        logger_1.default.error("Login failed", error);
        res.status(500).json({ error: "Login failed" });
    }
};
exports.login = login;
const guestLogin = async (req, res) => {
    try {
        const authResponse = await authService_1.default.guestLogin();
        res.json({
            ...authResponse,
            message: "Guest access granted (limited)",
        });
    }
    catch (error) {
        logger_1.default.error("Guest login failed", error);
        res.status(500).json({ error: "Guest login failed" });
    }
};
exports.guestLogin = guestLogin;
