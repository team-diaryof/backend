import "dotenv/config";
import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(process.env, {
  DATABASE_URL: str({ desc: "MongoDB Atlas connection string" }),
  PORT: port({ default: 8080 }),
  JWT_SECRET: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  SESSION_SECRET: str(),
});
