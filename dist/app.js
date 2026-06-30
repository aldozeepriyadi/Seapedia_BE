"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = require("./routes");
const allowedOrigins = new Set([
    env_1.env.frontendUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]);
function isAllowedOrigin(origin) {
    if (!origin || allowedOrigins.has(origin)) {
        return true;
    }
    try {
        const { hostname, protocol } = new URL(origin);
        return protocol === "https:" && hostname.endsWith(".vercel.app");
    }
    catch {
        return false;
    }
}
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin(origin, callback) {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error("Origin tidak diizinkan oleh CORS."));
        },
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use("/api", routes_1.apiRoutes);
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
