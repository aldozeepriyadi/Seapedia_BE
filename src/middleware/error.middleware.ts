import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../utils/http-error";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    res.status(400).json({ message: "JSON request body tidak valid." });
    return;
  }

  if (error instanceof z.ZodError) {
    res.status(400).json({
      message: "Input tidak valid.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
}
