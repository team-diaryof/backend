"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const permissions_1 = require("../utils/permissions");
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};
exports.authenticate = authenticate;
const requireRole = (roles) => (req, res, next) => {
    const user = req.user;
    if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Access denied" });
    }
    next();
};
exports.requireRole = requireRole;
const requirePermission = (permission) => (req, res, next) => {
    const user = req.user;
    if (!(0, permissions_1.hasPermission)(user.role, permission)) {
        return res.status(403).json({ error: "Permission denied" });
    }
    next();
};
exports.requirePermission = requirePermission;
