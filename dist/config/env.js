"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.env = {
    port: Number(process.env.PORT ?? 4100),
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5174",
    databaseUrl: process.env.DATABASE_URL ??
        "postgresql://postgres:postgres123@localhost:5432/seapedia",
};
