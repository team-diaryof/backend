"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const client_1 = __importDefault(require("../prisma/client"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_2 = require("@prisma/client");
const env_1 = require("../config/env");
class AuthService {
    async register(email, password, name) {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await client_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: client_2.Role.USER,
                googleId: undefined, // Don't set googleId for regular registrations
            },
        });
        return {
            token: this.generateToken(user),
            user: this.sanitizeUser(user),
        };
    }
    async login(email, password) {
        const user = await client_1.default.user.findUnique({ where: { email } });
        if (user && (await bcryptjs_1.default.compare(password, user.password || ""))) {
            return {
                token: this.generateToken(user),
                user: this.sanitizeUser(user),
            };
        }
        return null;
    }
    async guestLogin() {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
        const user = await client_1.default.user.create({
            data: {
                email: `guest_${(0, uuid_1.v4)()}@example.com`,
                role: client_2.Role.GUEST,
                expiresAt,
                name: `Guest_${(0, uuid_1.v4)().slice(0, 8)}`,
                googleId: `guest_${(0, uuid_1.v4)()}`, // Provide unique googleId for guests
            },
        });
        return {
            token: this.generateToken(user, "15m"),
            user: this.sanitizeUser(user),
        };
    }
    generateToken(user, expiresIn = "1h") {
        return jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, env_1.env.JWT_SECRET, {
            expiresIn: expiresIn,
        });
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
