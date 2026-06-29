import { Request, Response } from "express";

export class HealthController {
  static show(_req: Request, res: Response) {
    res.json({
      status: "ok",
      service: "SEAPEDIA Level 4 API",
      timestamp: new Date().toISOString(),
    });
  }
}
