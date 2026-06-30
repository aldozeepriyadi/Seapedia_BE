"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const isHostedRuntime = process.env.NODE_ENV === "production" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
if (isHostedRuntime && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum diset. Tambahkan Supabase Session Pooler DATABASE_URL di environment variables deployment.");
}
exports.env = {
    port: Number(process.env.PORT ?? 4100),
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    databaseUrl: process.env.DATABASE_URL ??
        "postgresql://postgres:postgres123@localhost:5432/seapedia",
};
