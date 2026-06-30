"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
const http_error_1 = require("../utils/http-error");
function errorMiddleware(error, _req, res, _next) {
    if (error instanceof SyntaxError &&
        "status" in error &&
        error.status === 400 &&
        "type" in error &&
        error.type === "entity.parse.failed") {
        res.status(400).json({ message: "JSON request body tidak valid." });
        return;
    }
    if (error instanceof zod_1.z.ZodError) {
        res.status(400).json({
            message: "Input tidak valid.",
            issues: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    if (error instanceof http_error_1.HttpError) {
        res.status(error.status).json({ message: error.message });
        return;
    }
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
}
