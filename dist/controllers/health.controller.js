"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
class HealthController {
    static show(_req, res) {
        res.json({
            status: "ok",
            service: "SEAPEDIA Level 1 API",
            timestamp: new Date().toISOString(),
        });
    }
}
exports.HealthController = HealthController;
