import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { apiRoutes } from "./routes";

const allowedOrigins = new Set([
  env.frontendUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
]);

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin tidak diizinkan oleh CORS."));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use("/api", apiRoutes);
  app.use(errorMiddleware);

  return app;
}
