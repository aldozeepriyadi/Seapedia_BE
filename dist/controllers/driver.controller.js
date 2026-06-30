"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverController = void 0;
const driver_model_1 = require("../models/driver.model");
const http_error_1 = require("../utils/http-error");
class DriverController {
    static async availableJobs(_req, res) {
        res.json({ jobs: await driver_model_1.DriverModel.listAvailableJobs() });
    }
    static async activeJob(req, res) {
        res.json({ job: await driver_model_1.DriverModel.activeJob(req.auth.userId) });
    }
    static async jobHistory(req, res) {
        res.json({ jobs: await driver_model_1.DriverModel.jobHistory(req.auth.userId) });
    }
    static async report(req, res) {
        res.json({ report: await driver_model_1.DriverModel.report(req.auth.userId) });
    }
    static async showJob(req, res) {
        const job = await driver_model_1.DriverModel.findJob(String(req.params.id), req.auth.userId);
        if (!job)
            throw new http_error_1.HttpError(404, "Delivery job tidak ditemukan.");
        res.json({ job });
    }
    static async takeJob(req, res) {
        const job = await driver_model_1.DriverModel.takeJob(String(req.params.id), req.auth.userId);
        res.json({ job });
    }
    static async completeJob(req, res) {
        const job = await driver_model_1.DriverModel.completeJob(String(req.params.id), req.auth.userId);
        res.json({ job });
    }
}
exports.DriverController = DriverController;
