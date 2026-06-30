import { Response } from "express";
import { DriverModel } from "../models/driver.model";
import { AuthedRequest } from "../types/auth";
import { HttpError } from "../utils/http-error";

export class DriverController {
  static async availableJobs(_req: AuthedRequest, res: Response) {
    res.json({ jobs: await DriverModel.listAvailableJobs() });
  }

  static async activeJob(req: AuthedRequest, res: Response) {
    res.json({ job: await DriverModel.activeJob(req.auth!.userId) });
  }

  static async jobHistory(req: AuthedRequest, res: Response) {
    res.json({ jobs: await DriverModel.jobHistory(req.auth!.userId) });
  }

  static async report(req: AuthedRequest, res: Response) {
    res.json({ report: await DriverModel.report(req.auth!.userId) });
  }

  static async showJob(req: AuthedRequest, res: Response) {
    const job = await DriverModel.findJob(String(req.params.id), req.auth!.userId);
    if (!job) throw new HttpError(404, "Delivery job tidak ditemukan.");
    res.json({ job });
  }

  static async takeJob(req: AuthedRequest, res: Response) {
    const job = await DriverModel.takeJob(String(req.params.id), req.auth!.userId);
    res.json({ job });
  }

  static async completeJob(req: AuthedRequest, res: Response) {
    const job = await DriverModel.completeJob(String(req.params.id), req.auth!.userId);
    res.json({ job });
  }
}
