import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import cors from "cors";
import cron from "node-cron";
import { env } from "./config/env";
import passport from "passport";
import logger from "./utils/logger";
import authRoutes from "./routes/authRoute";
import userRoutes from "./routes/userRoute";
import "./passport"; // Import passport configuration

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Server is up and running");
});

// API v1 router
const apiV1 = express.Router();
app.use("/api/v1", apiV1);

apiV1.use("/auth", authRoutes);
apiV1.use("/user", userRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logger.info("Server started successfully");
});
