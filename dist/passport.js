"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_1 = require("./config/env");
const client_1 = __importDefault(require("./prisma/client"));
const client_2 = require("@prisma/client");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.env.GOOGLE_CLIENT_ID,
    clientSecret: env_1.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${env_1.env.BASE_URL}/auth/google/callback`,
    scope: ["profile", "email"],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await client_1.default.user.findUnique({
            where: { googleId: profile.id },
        });
        if (!user) {
            user = await client_1.default.user.create({
                data: {
                    googleId: profile.id,
                    email: profile.emails?.[0].value || "",
                    name: profile.displayName,
                    role: client_2.Role.USER,
                },
            });
        }
        done(null, user);
    }
    catch (error) {
        done(error, false);
    }
}));
passport_1.default.serializeUser((user, done) => done(null, user.id));
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await client_1.default.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
