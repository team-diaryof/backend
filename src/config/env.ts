import "dotenv/config";
import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(process.env, {
  DATABASE_URL: str({ desc: "PostgreSQL connection string" }),
  PORT: port({ default: 8080 }),
  JWT_SECRET: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  SESSION_SECRET: str(),
  BASE_URL: str({
    default: "http://localhost:8080",
    desc: "Base URL for OAuth callbacks",
  }),
  EMAIL_API_SECRET: str({ desc: "Email API secret key for authorization" }),
  CLOUDINARY_CLOUD_NAME: str({ desc: "Cloudinary cloud name" }),
  CLOUDINARY_API_KEY: str({ desc: "Cloudinary API key" }),
  CLOUDINARY_API_SECRET: str({ desc: "Cloudinary API secret" }),
});
